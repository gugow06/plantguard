# Vídeo pitch do PlantGuard (Remotion)

Vídeo de ~5 minutos (1920×1080, 30 fps) gerado com [Remotion](https://www.remotion.dev/): cenas animadas na identidade visual do projeto, gravações reais da plataforma e narração com legenda sincronizada. Saída: `../PlantGuard-video-pitch.mp4`.

## Como funciona a sincronia

1. `scripts/narration.json` tem o roteiro dividido em cenas e frases (`text` é a legenda; `tts`, quando existe, é a grafia usada só para a pronúncia).
2. `scripts/make_audio.py` gera um áudio por frase (`public/audio/<id>.wav`), mede cada duração e escreve `src/timeline.json`.
3. Cada cena em `src/scenes/index.tsx` anima seus elementos no frame em que a frase correspondente começa (`at(scene, 'p1')`): números contam quando são falados, cartões entram com o assunto, clipes trocam com a narração e a legenda revela palavra por palavra.

## Gerar de novo

```bash
cd video
npm install
python3 scripts/make_audio.py                     # narração + linha do tempo (voz Luciana do macOS)
export REMOTION_BROWSER=<caminho de um chrome-headless-shell>   # ver observação abaixo
npm run render                                    # gera ../PlantGuard-video-pitch.mp4
npm run studio                                    # pré-visualizar e ajustar no navegador
```

As gravações de tela (`public/clips/*.mp4`) vêm de `scripts/record_clips.py`, com a stack rodando e o producer contínuo:

```bash
STREAM_MAX_MESSAGES=0 STREAM_INTERVAL_MS=4000 docker compose -f ../infra/docker-compose.yml up -d producer
python scripts/record_clips.py raw        # depois converter para public/clips/*.mp4
```

## Trocar a narração pela voz da equipe

Grave cada frase de `scripts/narration.json` como `public/audio/<id>.wav` (mesmo id) e rode:

```bash
python3 scripts/make_audio.py --keep-audio   # só remede as durações; as animações se reajustam sozinhas
npm run render
```

## Observação sobre o navegador

O `chrome-headless-shell` que o Remotion baixa trava neste Mac (o processo de GPU não encontra o `icudtl.dat`). O render usa o do Playwright (`python -m playwright install chromium-headless-shell`), indicado em `REMOTION_BROWSER` e lido por `remotion.config.ts`.

## Licença

O Remotion tem licença gratuita para pessoas físicas, organizações sem fins lucrativos e empresas de até 3 pessoas. Confirmem na [licença do Remotion](https://www.remotion.dev/license) se o uso de vocês se enquadra.
