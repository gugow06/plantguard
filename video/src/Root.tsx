import React from 'react';
import { AbsoluteFill, Composition, Sequence } from 'remotion';
import { timeline, type Scene } from './theme';
import { Abertura, Arquitetura, Confiavel, Decisao, Demo, Fim, Melhorias, Problema, Processo, Produto, Solucao } from './scenes';

const SCENES: Record<string, React.FC<{ scene: Scene }>> = {
  abertura: Abertura,
  problema: Problema,
  solucao: Solucao,
  arquitetura: Arquitetura,
  demo: Demo,
  decisao: Decisao,
  processo: Processo,
  melhorias: Melhorias,
  confiavel: Confiavel,
  produto: Produto,
  fim: Fim,
};

const Pitch: React.FC = () => (
  <AbsoluteFill style={{ background: '#0e2a1c' }}>
    {timeline.scenes.map((scene) => {
      const S = SCENES[scene.id];
      return (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames} name={scene.id}>
          <S scene={scene} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PlantGuardPitch"
    component={Pitch}
    durationInFrames={timeline.durationInFrames}
    fps={timeline.fps}
    width={1920}
    height={1080}
  />
);
