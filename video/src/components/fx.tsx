import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, display, mono, sans, type Scene } from '../theme';

/** Entrada com mola a partir do frame `start` (relativo à cena). */
export const useEnter = (start: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config: { damping, mass: 0.7 } });
};

/** Sobe e aparece quando a frase começa. */
export const Rise: React.FC<{ start: number; children: React.ReactNode; y?: number; style?: React.CSSProperties }> = ({
  start,
  children,
  y = 40,
  style,
}) => {
  const p = useEnter(start);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>
  );
};

/** Fundo com gradiente que respira e folhas desfocadas à deriva. */
export const Backdrop: React.FC<{ tone?: 'dark' | 'paper' | 'cream' | 'green' }> = ({ tone = 'dark' }) => {
  const frame = useCurrentFrame();
  const bg = { dark: C.dark, paper: C.paper, cream: C.cream, green: C.green }[tone];
  const glow = tone === 'dark' || tone === 'green' ? 'rgba(159,220,183,0.10)' : 'rgba(45,106,79,0.07)';
  const x = 30 + Math.sin(frame / 90) * 8;
  const y = 40 + Math.cos(frame / 110) * 6;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, ${glow}, transparent 55%)` }} />
      <Leaf size={520} x={1520 + Math.sin(frame / 70) * 14} y={-90 + Math.cos(frame / 80) * 10} rot={frame / 9} tone={tone} />
      <Leaf size={300} x={-80 + Math.cos(frame / 60) * 10} y={760} rot={-frame / 12} tone={tone} />
    </AbsoluteFill>
  );
};

const Leaf: React.FC<{ size: number; x: number; y: number; rot: number; tone: string }> = ({ size, x, y, rot, tone }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, opacity: tone === 'dark' || tone === 'green' ? 0.07 : 0.06 }}
    fill="none"
    stroke={tone === 'dark' || tone === 'green' ? C.mint : C.leaf}
    strokeWidth={0.6}
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

/** Logo animado: a folha é desenhada pelo traço. */
export const Logo: React.FC<{ start: number; size?: number; color?: string }> = ({ start, size = 120, color = C.mint }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - start, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(t, [0.4, 1], [0, 1], { extrapolateLeft: 'clamp' })} />
    </svg>
  );
};

/** Número que conta até o valor quando a frase começa. */
export const Counter: React.FC<{
  start: number;
  from?: number;
  to: number;
  decimals?: number;
  suffix?: string;
  frames?: number;
  style?: React.CSSProperties;
}> = ({ start, from = 0, to, decimals = 0, suffix = '', frames = 36, style }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - start, [0, frames], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const txt = v.toFixed(decimals).replace('.', ',');
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{txt}{suffix}</span>;
};

/** Pulso de destaque (anel) sincronizado com uma frase. */
export const Pulse: React.FC<{ start: number; color?: string; radius?: number; style?: React.CSSProperties }> = ({
  start,
  color = C.red,
  radius = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < 0) return null;
  const cycle = (f % 45) / 45;
  const opacity = interpolate(cycle, [0, 1], [0.7, 0]) * interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        inset: -cycle * 18,
        border: `4px solid ${color}`,
        borderRadius: radius + cycle * 18,
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};

/** Janela de navegador com a gravação real da plataforma, com zoom lento. */
export const Browser: React.FC<{
  clip: string;
  start: number;
  startFrom?: number; // segundos do clipe
  url: string;
  width?: number;
  zoom?: [number, number];
  origin?: string;
  playbackRate?: number;
  children?: React.ReactNode;
}> = ({ clip, start, startFrom = 0, url, width = 1560, zoom = [1, 1.06], origin = '50% 40%', playbackRate = 1, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useEnter(start, 20);
  const height = (width * 1080) / 1920;
  const scale = interpolate(frame - start, [0, 10 * fps], zoom, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start - 1) return null;
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.35)',
        border: `1px solid rgba(255,255,255,0.12)`,
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + 0.04 * p})`,
        background: '#fff',
      }}
    >
      <div style={{ height: 44, background: '#ece8dc', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
        {['#e0605a', '#e2b33e', '#5fb760'].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div style={{ marginLeft: 18, flex: 1, height: 28, borderRadius: 8, background: '#fbfaf6', color: C.muted, fontFamily: mono, fontSize: 16, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
          {url}
        </div>
      </div>
      <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: origin }}>
          {/* o clipe começa a tocar quando a janela aparece, não no início da cena */}
          <Sequence from={start} layout="none">
            <OffthreadVideo
              src={staticFile(`clips/${clip}.mp4`)}
              startFrom={Math.round(startFrom * fps)}
              playbackRate={playbackRate}
              muted
              style={{ width, height }}
            />
          </Sequence>
          {/* destaques dentro do zoom: acompanham a gravação */}
          {children}
        </div>
      </div>
    </div>
  );
};

/** Caixa de destaque desenhada sobre a gravação (coordenadas em px do clipe 1920×1080). */
export const Spotlight: React.FC<{ start: number; x: number; y: number; w: number; h: number; scale: number; label?: string; color?: string }> = ({
  start,
  x,
  y,
  w,
  h,
  scale,
  label,
  color = C.mint,
}) => {
  const p = useEnter(start, 14);
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
        border: `5px solid ${color}`,
        borderRadius: 14,
        boxShadow: `0 0 0 9999px rgba(14,42,28,${0.38 * p})`,
        opacity: p,
        transform: `scale(${1.08 - 0.08 * p})`,
      }}
    >
      {label ? (
        <div style={{ position: 'absolute', ...(y * scale < 70 ? { bottom: -58 } : { top: -58 }), left: -5, whiteSpace: 'nowrap', background: color, color: C.dark, fontFamily: sans, fontWeight: 700, fontSize: 26, padding: '8px 16px', borderRadius: 10 }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/** Terminal que imprime linhas de log no ritmo da fala. */
export const Terminal: React.FC<{ start: number; lines: string[]; perLine?: number; title?: string }> = ({ start, lines, perLine = 14, title = 'docker compose logs -f consumer' }) => {
  const frame = useCurrentFrame();
  const p = useEnter(start, 20);
  const shown = Math.max(0, Math.floor((frame - start) / perLine) + 1);
  return (
    <div style={{ width: 1500, borderRadius: 18, overflow: 'hidden', background: '#0b1a12', boxShadow: '0 40px 120px rgba(0,0,0,0.4)', opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
      <div style={{ height: 44, background: '#132a1d', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', color: C.soft, fontFamily: mono, fontSize: 18 }}>
        {['#e0605a', '#e2b33e', '#5fb760'].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 16 }}>$ {title}</span>
      </div>
      <div style={{ padding: '26px 30px', fontFamily: mono, fontSize: 27, lineHeight: 1.65, minHeight: 470 }}>
        {lines.slice(0, shown).map((l, i) => {
          const alert = l.includes('ALERTA');
          const age = frame - start - i * perLine;
          const flash = alert ? interpolate(age, [0, 8, 30], [0, 1, 0.25], { extrapolateRight: 'clamp' }) : 0;
          return (
            <div key={i} style={{ color: alert ? '#ffb4ab' : '#cfe8d9', background: `rgba(214,69,65,${flash * 0.35})`, borderRadius: 6, padding: '0 8px', whiteSpace: 'pre' }}>
              {l}
            </div>
          );
        })}
        <span style={{ color: C.mint, opacity: Math.floor(frame / 15) % 2 ? 1 : 0 }}>▋</span>
      </div>
    </div>
  );
};

/** Legenda sincronizada: revela palavra a palavra na duração da frase. */
export const Captions: React.FC<{ scene: Scene; tone?: 'dark' | 'light' }> = ({ scene, tone = 'dark' }) => {
  const frame = useCurrentFrame();
  const s = scene.segments.find((x) => frame >= x.from && frame < x.from + x.durationInFrames + 12);
  if (!s) return null;
  const words = s.text.split(' ');
  const progress = interpolate(frame - s.from, [0, s.durationInFrames * 0.92], [0, words.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeIn = interpolate(frame - s.from, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame - (s.from + s.durationInFrames), [0, 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const light = tone === 'light';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', justifyContent: 'center', opacity: fadeIn * fadeOut }}>
      <div
        style={{
          maxWidth: 1500,
          padding: '16px 30px',
          borderRadius: 16,
          background: light ? 'rgba(251,250,246,0.92)' : 'rgba(8,24,16,0.78)',
          color: light ? C.ink : C.paper,
          fontFamily: sans,
          fontSize: 34,
          lineHeight: 1.35,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ opacity: i < progress ? 1 : 0.32 }}>
            {w}{' '}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Rótulo do capítulo e barra de progresso do vídeo. */
export const Chrome: React.FC<{ label: string; index: number; total: number; tone?: 'dark' | 'light' }> = ({ label, index, total, tone = 'dark' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  const light = tone === 'light';
  return (
    <>
      <div style={{ position: 'absolute', top: 54, left: 128, display: 'flex', alignItems: 'center', gap: 16, opacity: p, fontFamily: sans, fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: light ? C.leaf : C.mint }}>
        <span style={{ fontFamily: display, letterSpacing: 0, fontSize: 30 }}>{String(index).padStart(2, '0')}</span>
        <span style={{ width: 36, height: 2, background: 'currentColor' }} />
        {label}
      </div>
      <div style={{ position: 'absolute', top: 64, right: 128, width: 220, height: 4, borderRadius: 2, background: light ? 'rgba(27,77,52,0.15)' : 'rgba(159,220,183,0.2)' }}>
        <div style={{ width: `${((index - 1 + frame / durationInFrames) / total) * 100}%`, height: 4, borderRadius: 2, background: light ? C.leaf : C.mint }} />
      </div>
    </>
  );
};

/** Transição entre cenas: cortina verde que varre a tela. */
export const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const inn = interpolate(frame, [0, 14], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      {inn > 0 ? <AbsoluteFill style={{ background: C.mint, transform: `translateX(${(1 - inn) * 100}%)` }} /> : null}
      {out > 0 ? <AbsoluteFill style={{ background: C.mint, transform: `translateX(${(out - 1) * 100}%)` }} /> : null}
    </>
  );
};

export const H = {
  eyebrow: (tone: 'dark' | 'light' = 'dark'): React.CSSProperties => ({ fontFamily: sans, fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: tone === 'light' ? C.leaf : C.mint }),
  title: (tone: 'dark' | 'light' = 'dark', size = 84): React.CSSProperties => ({ fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 1.04, letterSpacing: -1.5, color: tone === 'light' ? C.dark : C.paper, margin: 0 }),
  body: (tone: 'dark' | 'light' = 'dark', size = 34): React.CSSProperties => ({ fontFamily: sans, fontSize: size, lineHeight: 1.4, color: tone === 'light' ? C.muted : C.soft, margin: 0 }),
};
