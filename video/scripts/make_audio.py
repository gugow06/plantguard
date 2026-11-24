"""Gera a narração e a linha do tempo do vídeo, com duração EXATA.

Motores de voz:
  --engine gemini  (padrão) voz neural do Gemini TTS: uma requisição por cena,
                   dividida nas pausas entre frases. Precisa de GEMINI_API_KEY.
  --engine say     voz do macOS (offline, mais robótica).
  --keep-audio     não gera áudio: só remede public/audio/<id>.wav (ex.: voz da equipe).

A linha do tempo (src/timeline.json) fecha em TARGET_SECONDS exatos: o tempo que
sobra da fala é distribuído em pausas e em tempo extra de tela nas cenas com
gravações. Se a fala não couber, o script para com erro (nunca passa do alvo).

Uso: python scripts/make_audio.py [--engine gemini|say] [--keep-audio]
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import ssl
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TARGET_SECONDS = 300  # 5:00 exatos
MIN_PAD_IN, MIN_PAD_OUT, MIN_GAP = 0.5, 0.6, 0.3  # mínimos (s)

GEMINI_MODEL = "gemini-3.8-flash-tts"
GEMINI_VOICE = os.environ.get("TTS_VOICE", "Kore")

cfg = json.loads((ROOT / "scripts/narration.json").read_text(encoding="utf-8"))
args = sys.argv[1:]
engine = args[args.index("--engine") + 1] if "--engine" in args else "gemini"
keep = "--keep-audio" in args
audio_dir = ROOT / "public/audio"
cache_dir = ROOT / "raw/tts-cache"
audio_dir.mkdir(parents=True, exist_ok=True)
cache_dir.mkdir(parents=True, exist_ok=True)


# ───────────── áudio: leitura, escrita, silêncio ─────────────
def read_wav(data: bytes) -> tuple[int, list[int]]:
    w = wave.open(io.BytesIO(data))
    assert w.getnchannels() == 1 and w.getsampwidth() == 2, "esperado WAV mono 16 bits"
    raw = w.readframes(w.getnframes())
    return w.getframerate(), list(struct.unpack(f"<{len(raw) // 2}h", raw))


def write_wav(path: Path, rate: int, samples: list[int]) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(struct.pack(f"<{len(samples)}h", *samples))


def wav_seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def silences(rate: int, s: list[int], win_ms=20, thresh=500, min_ms=220) -> list[tuple[int, int]]:
    """Trechos de silêncio (início, fim) em amostras."""
    win = rate * win_ms // 1000
    quiet = []
    for i in range(0, len(s), win):
        chunk = s[i:i + win]
        rms = (sum(x * x for x in chunk) / max(1, len(chunk))) ** 0.5
        quiet.append(rms < thresh)
    out, start = [], None
    for k, q in enumerate(quiet + [False]):
        if q and start is None:
            start = k
        elif not q and start is not None:
            if (k - start) * win_ms >= min_ms:
                out.append((start * win, min(len(s), k * win)))
            start = None
    return out


def trim(rate: int, s: list[int], keep_ms=60) -> list[int]:
    sil = silences(rate, s, min_ms=40)
    a, b = 0, len(s)
    if sil and sil[0][0] == 0:
        a = max(0, sil[0][1] - rate * keep_ms // 1000)
    if sil and sil[-1][1] >= len(s) - rate // 50:
        b = min(len(s), sil[-1][0] + rate * keep_ms // 1000)
    return s[a:b]


def split_scene(rate: int, s: list[int], texts: list[str]) -> list[list[int]]:
    """Divide a fala da cena em frases: cada corte vai na pausa mais próxima de onde a
    frase deveria terminar (estimado pela proporção de caracteres do texto)."""
    s = trim(rate, s)
    n = len(texts)
    if n == 1:
        return [s]
    gaps = [g for g in silences(rate, s, min_ms=120) if g[0] > 0 and g[1] < len(s)]
    total = sum(len(t) for t in texts)
    cuts, used, acc = [], set(), 0
    for t in texts[:-1]:
        acc += len(t)
        expected = len(s) * acc / total
        cands = [(abs((a + b) / 2 - expected), (a, b)) for a, b in gaps if (a, b) not in used and (not cuts or a > cuts[-1][1])]
        if not cands:
            raise RuntimeError("pausas insuficientes para dividir a cena")
        _, best = min(cands)
        used.add(best)
        cuts.append(best)
    parts, prev = [], 0
    for a, b in cuts:
        mid = (a + b) // 2
        parts.append(trim(rate, s[prev:mid]))
        prev = mid
    parts.append(trim(rate, s[prev:]))
    return parts


# ───────────── motores ─────────────
def gemini_tts(text: str) -> bytes:
    import certifi  # certificados raiz (Python do python.org não traz)

    key_hash = hashlib.sha1(f"{GEMINI_MODEL}|{GEMINI_VOICE}|{text}".encode()).hexdigest()[:16]
    cached = cache_dir / f"{key_hash}.wav"
    if cached.exists():
        return cached.read_bytes()
    body = {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": GEMINI_VOICE}}},
        },
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]},
    )
    ctx = ssl.create_default_context(cafile=certifi.where())
    for attempt in range(8):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=180, context=ctx))
            data = base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            cached.write_bytes(data)
            time.sleep(21)  # respeita o limite de requisições por minuto
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"    limite de cota, aguardando 35 s (tentativa {attempt + 1})", flush=True)
                time.sleep(35)
                continue
            raise RuntimeError(f"Gemini TTS HTTP {e.code}: {e.read()[:300]!r}")
    raise RuntimeError("Gemini TTS: cota esgotada")


def say_tts(text: str, out: Path) -> None:
    aiff = out.with_suffix(".aiff")
    subprocess.run(["say", "-v", cfg.get("voice", "Luciana"), "-r", str(cfg.get("rate", 160)), "-o", str(aiff), text], check=True)
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@48000", str(aiff), str(out)], check=True)
    aiff.unlink()


# ───────────── geração ─────────────
if not keep:
    for scene in cfg["scenes"]:
        segs = scene["segments"]
        print(f"  {scene['id']}: {len(segs)} frases ({engine})", flush=True)
        if engine == "gemini":
            text = "\n\n".join(s["text"] for s in segs)
            rate, samples = read_wav(gemini_tts(text))
            for seg, part in zip(segs, split_scene(rate, samples, [x["text"] for x in segs])):
                write_wav(audio_dir / f"{seg['id']}.wav", rate, part)
        else:
            for seg in segs:
                say_tts(seg.get("tts", seg["text"]), audio_dir / f"{seg['id']}.wav")

# ───────────── linha do tempo com duração exata ─────────────
speech = {seg["id"]: round(wav_seconds(audio_dir / f"{seg['id']}.wav") * FPS)
          for sc in cfg["scenes"] for seg in sc["segments"]}
n_scenes = len(cfg["scenes"])
n_gaps = sum(len(sc["segments"]) - 1 for sc in cfg["scenes"])
fixed = sum(speech.values()) + n_scenes * round((MIN_PAD_IN + MIN_PAD_OUT) * FPS) + n_gaps * round(MIN_GAP * FPS)
target = TARGET_SECONDS * FPS
slack = target - fixed
if slack < 0:
    raise SystemExit(f"A fala não cabe em {TARGET_SECONDS}s: sobram {slack / FPS:.1f}s. Encurte o texto.")

# Um terço do que sobra vira tela extra nas cenas com gravação; o resto, pausas maiores.
weights = {sc["id"]: sc.get("extraHold", 0) for sc in cfg["scenes"]}
total_w = sum(weights.values()) or 1
hold_budget = slack // 3
holds = {k: hold_budget * w // total_w for k, w in weights.items()}
gap_budget = slack - sum(holds.values())
extra_gap = gap_budget // max(1, n_gaps + n_scenes)

timeline = {"fps": FPS, "scenes": []}
frame = 0
for sc in cfg["scenes"]:
    start = frame
    t = round(MIN_PAD_IN * FPS) + extra_gap // 2
    segs = []
    for i, seg in enumerate(sc["segments"]):
        n = speech[seg["id"]]
        segs.append({"id": seg["id"], "text": seg["text"], "from": t, "durationInFrames": n, "audio": f"audio/{seg['id']}.wav"})
        t += n
        if i < len(sc["segments"]) - 1:
            t += round(MIN_GAP * FPS) + extra_gap
    length = t + round(MIN_PAD_OUT * FPS) + extra_gap - extra_gap // 2 + holds[sc["id"]]
    timeline["scenes"].append({"id": sc["id"], "from": start, "durationInFrames": length, "segments": segs})
    frame += length

# arredondamentos: o que faltar para o alvo exato vai para a última cena
timeline["scenes"][-1]["durationInFrames"] += target - frame
timeline["durationInFrames"] = target
(ROOT / "src/timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"fala: {sum(speech.values()) / FPS:.1f}s · total: {target / FPS:.1f}s ({target} frames)")
for s in timeline["scenes"]:
    print(f"  {s['id']:<12} {s['durationInFrames'] / FPS:6.1f}s")
