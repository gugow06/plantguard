import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadDMSans } from '@remotion/google-fonts/DMSans';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import timelineJson from './timeline.json';

export const { fontFamily: display } = loadFraunces('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
});
export const { fontFamily: sans } = loadDMSans('normal', {
  weights: ['400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
});
export const { fontFamily: mono } = loadMono('normal', { weights: ['400', '700'], subsets: ['latin'] });

/** Mesma identidade da documentação e dos slides. */
export const C = {
  dark: '#0e2a1c',
  dark2: '#163a28',
  green: '#1b4d34',
  leaf: '#2d6a4f',
  mint: '#9fdcb7',
  cream: '#f1ede1',
  paper: '#fbfaf6',
  ink: '#13251a',
  muted: '#4a5a4c',
  soft: '#c9dccf',
  line: '#ddd6c3',
  red: '#d64541',
  redDeep: '#b3261e',
  amber: '#d4a017',
};

export type Segment = { id: string; text: string; from: number; durationInFrames: number; audio: string };
export type Scene = { id: string; from: number; durationInFrames: number; segments: Segment[] };
export const timeline = timelineJson as { fps: number; durationInFrames: number; scenes: Scene[] };

/** Início (em frames, relativo à cena) da frase `id`. */
export const at = (scene: Scene, id: string) => {
  const s = scene.segments.find((x) => x.id === id);
  if (!s) throw new Error(`frase ${id} não existe na cena ${scene.id}`);
  return s.from;
};
export const seg = (scene: Scene, id: string) => scene.segments.find((x) => x.id === id)!;
