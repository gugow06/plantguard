import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, display, mono, sans, at, seg, type Scene } from '../theme';
import { Backdrop, Browser, Captions, Chrome, Counter, H, Logo, Pulse, Rise, Spotlight, Terminal, useEnter, Wipe } from '../components/fx';

type Tone = 'dark' | 'paper' | 'cream' | 'green';
const light = (t: Tone) => (t === 'paper' || t === 'cream' ? 'light' : 'dark');

/** Moldura comum: fundo, capítulo, narração, legenda e transição. */
const Shell: React.FC<{ scene: Scene; tone: Tone; label: string; index: number; children: React.ReactNode; captions?: boolean }> = ({
  scene,
  tone,
  label,
  index,
  children,
  captions = true,
}) => (
  <AbsoluteFill style={{ fontFamily: sans }}>
    <Backdrop tone={tone} />
    <Chrome label={label} index={index} total={11} tone={light(tone)} />
    <AbsoluteFill style={{ padding: '150px 128px 170px' }}>{children}</AbsoluteFill>
    {scene.segments.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames + 2}>
        <Audio src={staticFile(s.audio)} />
      </Sequence>
    ))}
    {captions ? <Captions scene={scene} tone={light(tone)} /> : null}
    <Wipe />
  </AbsoluteFill>
);

const Card: React.FC<{ start: number; title: string; body: string; tone?: 'dark' | 'light'; accent?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  start,
  title,
  body,
  tone = 'light',
  accent,
  children,
  style,
}) => {
  const p = useEnter(start);
  const dark = tone === 'dark';
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        background: dark ? C.dark2 : '#ffffff',
        border: `2px solid ${accent ?? (dark ? '#24533a' : C.line)}`,
        borderRadius: 28,
        padding: '36px 40px',
        opacity: p,
        transform: `translateY(${(1 - p) * 50}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        ...style,
      }}
    >
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 44, lineHeight: 1.1, color: dark ? C.mint : C.green }}>{title}</div>
      <div style={{ fontFamily: sans, fontSize: 30, lineHeight: 1.4, color: dark ? C.soft : C.muted }}>{body}</div>
      {children}
    </div>
  );
};

// ───────────────────────── 1. Abertura ─────────────────────────
export const Abertura: React.FC<{ scene: Scene }> = ({ scene }) => {
  const team = [
    'Gustavo Cristiano Pessoa de Souza · RM 551924',
    'Ricardo Akira Kato Lopes · RM 551447',
    'Kevin Richard Xavier · RM 551736',
    'Vinicius do Carmo Fonseca Freitas · RM 97599',
    'Gustavo Medeiros Miranda da Silva · RM 552093',
  ];
  const words = ['Do', 'diagnóstico', 'à', 'decisão', 'no', 'campo.'];
  const frame = useCurrentFrame();
  return (
    <Shell scene={scene} tone="dark" label="AgroSmart · Fase 7" index={1}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo start={4} size={96} />
          <Rise start={10}><span style={{ fontFamily: display, fontWeight: 800, fontSize: 64, color: C.paper }}>PlantGuard</span></Rise>
        </div>
        <h1 style={{ ...H.title('dark', 116), maxWidth: 1600 }}>
          {words.map((w, i) => (
            <Word key={i} start={at(scene, 'a1') + 12 + i * 5} text={w} hi={w === 'decisão'} />
          ))}
        </h1>
        <Rise start={at(scene, 'a3')}>
          <p style={{ ...H.body('dark', 38), maxWidth: 1300 }}>IA que identifica doenças em plantas, decide quando é preciso agir e avisa o produtor em segundos.</p>
        </Rise>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 48px', marginTop: 8 }}>
          {team.map((t, i) => (
            <Rise key={t} start={at(scene, 'a2') + i * 6} y={20}>
              <span style={{ fontSize: 26, color: C.soft }}>{t}</span>
            </Rise>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 128, top: 160, fontFamily: mono, fontSize: 22, color: C.soft, opacity: interpolate(frame, [20, 40], [0, 0.8], { extrapolateRight: 'clamp' }) }}>
        FIAP · 2026
      </div>
    </Shell>
  );
};

const Word: React.FC<{ start: number; text: string; hi: boolean }> = ({ start, text, hi }) => {
  const p = useEnter(start);
  return (
    <span style={{ display: 'inline-block', marginRight: 30, opacity: p, transform: `translateY(${(1 - p) * 60}px)`, color: hi ? C.mint : C.paper, fontStyle: hi ? 'italic' : 'normal' }}>
      {text}
    </span>
  );
};

// ───────────────────────── 2. Problema ─────────────────────────
export const Problema: React.FC<{ scene: Scene }> = ({ scene }) => (
  <Shell scene={scene} tone="paper" label="O problema" index={2}>
    <h2 style={H.title('light')}>A doença é vista quando já se espalhou</h2>
    <div style={{ display: 'flex', gap: 72, marginTop: 56, alignItems: 'center' }}>
      <div style={{ width: 600, flex: 'none', position: 'relative' }}>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 250, lineHeight: 1, color: C.redDeep }}>
          <Counter start={at(scene, 'p1')} to={40} suffix="%" frames={40} />
        </div>
        <Rise start={at(scene, 'p1') + 20}>
          <p style={{ ...H.body('light', 32), marginTop: 18 }}>da produção agrícola mundial se perde por ano para pragas e doenças de plantas.</p>
          <p style={{ fontSize: 22, color: C.muted, marginTop: 14 }}>Fonte: FAO</p>
        </Rise>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card start={at(scene, 'p2')} title="Sem agrônomo por perto" body="O diagnóstico depende de um especialista que nem sempre está no campo." />
        <Card start={at(scene, 'p3')} title="Diagnóstico tarde demais" body="A olho nu, a doença só aparece quando já tomou o talhão." />
        <Card start={at(scene, 'p4')} title="Quem mais perde é o pequeno" body="Pequenos e médios produtores não têm assistência técnica dedicada." accent={C.redDeep} />
      </div>
    </div>
  </Shell>
);

// ───────────────────────── 3. Solução ─────────────────────────
export const Solucao: React.FC<{ scene: Scene }> = ({ scene }) => {
  const s3 = seg(scene, 's3');
  const steps = [
    { n: '1', t: 'Captura', b: 'Foto no celular ou câmera no campo.', start: at(scene, 's2') },
    { n: '2', t: 'Diagnóstico e decisão', b: 'IA identifica a doença; regras dizem se é preciso intervir.', start: s3.from },
    { n: '3', t: 'Alerta', b: 'Chega em segundos, com o tratamento recomendado.', start: s3.from + Math.round(s3.durationInFrames * 0.62) },
  ];
  return (
    <Shell scene={scene} tone="cream" label="A solução" index={3}>
      <Rise start={8}>
        <h2 style={H.title('light')}>Um agrônomo digital que não dorme</h2>
      </Rise>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, marginTop: 70 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 ? <Arrow start={s.start} /> : null}
            <Card start={s.start} title={s.t} body={s.b}>
              <div style={{ position: 'absolute', top: 30, right: 36, fontFamily: display, fontSize: 64, fontWeight: 800, color: 'rgba(45,106,79,0.18)' }}>{s.n}</div>
            </Card>
          </React.Fragment>
        ))}
      </div>
    </Shell>
  );
};

const Arrow: React.FC<{ start: number; color?: string }> = ({ start, color = C.leaf }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame - start + 6, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ alignSelf: 'center', width: 56, height: 6, position: 'relative' }}>
      <div style={{ width: `${w * 100}%`, height: 6, borderRadius: 3, background: color }} />
      <div style={{ position: 'absolute', right: -6, top: -9, width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: `16px solid ${color}`, opacity: w }} />
    </div>
  );
};

// ───────────────────────── 4. Arquitetura ─────────────────────────
export const Arquitetura: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const cols = [
    { t: 'Entrada', items: ['Câmeras no campo → Apache Kafka', 'Foto do produtor pelo app', 'CSV e JSON em lote'], start: at(scene, 'r1') },
    { t: 'Processamento', items: ['Gemini diagnostica a imagem', 'Consumer grava no PostgreSQL', 'Regras R1–R4 decidem a ação'], start: at(scene, 'r2') },
    { t: 'Saída', items: ['Alertas no sino e por e-mail', 'Dashboard e analytics', 'Relatórios e mapa do processo'], start: at(scene, 'r3') },
  ];
  const tech = ['Next.js 16', 'Gemini 2.5 Flash', 'Kafka 3.9', 'PostgreSQL 16', 'Docker Compose', 'GitHub Actions', 'pm4py'];
  return (
    <Shell scene={scene} tone="dark" label="Como funciona" index={4}>
      <h2 style={H.title('dark')}>Entrada, processamento e saída</h2>
      <div style={{ display: 'flex', gap: 0, marginTop: 64, position: 'relative' }}>
        {cols.map((c, i) => {
          const p = useEnter(c.start);
          const active = frame >= c.start;
          return (
            <React.Fragment key={c.t}>
              {i > 0 ? <FlowLine start={c.start} /> : null}
              <div style={{ flex: 1, borderRadius: 28, padding: '36px 38px', background: active ? C.dark2 : 'rgba(22,58,40,0.4)', border: `2px solid ${active ? C.mint : '#24533a'}`, opacity: 0.35 + 0.65 * p, transform: `scale(${0.97 + 0.03 * p})` }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 46, color: C.mint, marginBottom: 18 }}>{c.t}</div>
                {c.items.map((it, j) => (
                  <Rise key={it} start={c.start + 8 + j * 7} y={16}>
                    <div style={{ fontSize: 29, color: C.soft, lineHeight: 1.45, marginBottom: 10 }}>{it}</div>
                  </Rise>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 44 }}>
        {tech.map((t, i) => (
          <Rise key={t} start={at(scene, 'r3') + 30 + i * 4} y={14}>
            <div style={{ fontSize: 24, fontWeight: 700, padding: '10px 22px', borderRadius: 999, background: C.dark2, color: C.mint }}>{t}</div>
          </Rise>
        ))}
      </div>
    </Shell>
  );
};

/** Linha entre colunas com partículas fluindo (dados em trânsito). */
const FlowLine: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const on = interpolate(frame - start, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ width: 90, alignSelf: 'center', height: 8, position: 'relative', opacity: on }}>
      <div style={{ position: 'absolute', top: 3, left: 8, right: 8, height: 2, background: 'rgba(159,220,183,0.35)' }} />
      {[0, 1, 2].map((k) => {
        const x = ((frame * 2.2 + k * 30) % 90) - 4;
        return <div key={k} style={{ position: 'absolute', left: x, top: 0, width: 8, height: 8, borderRadius: 4, background: C.mint, boxShadow: `0 0 12px ${C.mint}` }} />;
      })}
    </div>
  );
};

// ───────────────────────── 5. Demo ─────────────────────────
export const Demo: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const W = 1500;
  const k = W / 1920;
  const d = (id: string) => at(scene, id);
  const until = (id: string) => {
    const i = scene.segments.findIndex((s) => s.id === id);
    const next = scene.segments[i + 1];
    return next ? next.from : 99999;
  };
  const show = (id: string) => frame >= d(id) - 1 && frame < until(id) + 6;
  const logs = [
    '[producer] -> tomate_01.jpg | Doente | Tomate | 86.1%',
    '[consumer] ALERTA criado: Planta doente detectada: Tomate (86.1%)',
    '[consumer] <- tomate_01.jpg | Doente | salvo Analysis cmwv875f2',
    '[producer] -> tomate_02.jpg | Doente | Tomate | 88.3%',
    '[consumer] ALERTA criado: Planta doente detectada: Tomate (88.3%)',
    '[consumer] <- tomate_02.jpg | Doente | salvo Analysis cmwv878i9',
    '[producer] -> pimentao_02.jpg | Saudável | Pimentão | 81.0%',
    '[consumer] <- pimentao_02.jpg | Saudável | salvo Analysis cmwv872bs',
  ];
  const d4 = seg(scene, 'd4');
  const half = d4.from + Math.round(d4.durationInFrames * 0.45);
  return (
    <Shell scene={scene} tone="dark" label="A plataforma em uso" index={5}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
        {frame < d('d2') ? (
          <Rise start={d('d1')}>
            <div style={{ ...H.title('dark', 120), textAlign: 'center' }}>Vamos ver <span style={{ color: C.mint, fontStyle: 'italic' }}>funcionando</span>.</div>
          </Rise>
        ) : null}
        {show('d2') ? (
          <Browser clip="kafka" start={d('d2')} startFrom={3.4} url="localhost:8080 · Kafka UI · plant-classifications" width={W} zoom={[1, 1.04]}>
            <Spotlight start={d('d2') + 40} x={244} y={462} w={1022} h={283} scale={k} label="Mensagem no tópico: planta, status, confiança" />
          </Browser>
        ) : null}
        {show('d3') ? <Terminal start={d('d3')} lines={logs} perLine={11} /> : null}
        {show('d4') && frame < half ? (
          <Browser clip="sino" start={d('d4')} startFrom={2.2} url="localhost:3000/dashboard" width={W} zoom={[1, 1.05]} origin="70% 20%">
            <Spotlight start={d('d4') + 24} x={1210} y={52} w={323} h={456} scale={k} label="Alertas automáticos" color={C.red} />
          </Browser>
        ) : null}
        {show('d4') && frame >= half ? <Browser clip="analytics" start={half} startFrom={0.3} url="localhost:3000/dashboard/analytics" width={W} /> : null}
        {show('d5') ? (
          <Browser clip="monitor" start={d('d5')} startFrom={0.8} url="localhost:3000/monitor" width={W} zoom={[1, 1.05]} origin="50% 10%">
            <Spotlight start={d('d5') + 30} x={336} y={89} w={1248} h={138} scale={k} label="Saúde de cada serviço" />
          </Browser>
        ) : null}
        {frame >= d('d6') - 1 ? (
          <Browser clip="upload" start={d('d6')} startFrom={0.5} url="localhost:3000/dashboard" width={W} zoom={[1, 1.08]} origin="50% 45%">
            <Spotlight start={d('d6') + 24} x={352} y={185} w={1216} h={240} scale={k} label="Foto → Gemini → diagnóstico e tratamento" />
          </Browser>
        ) : null}
      </div>
    </Shell>
  );
};

// ───────────────────────── 6. Decisão ─────────────────────────
export const Decisao: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const e3 = seg(scene, 'e3');
  const rows = [
    { r: 'R1', q: 'Alguma análise doente na espécie', a: 'Alerta de doença', hot: false },
    { r: 'R2', q: '50% ou mais das análises doentes', a: 'Intervenção urgente', hot: frame >= e3.from && frame < e3.from + e3.durationInFrames * 0.55 },
    { r: 'R3', q: 'Mesma patologia em 3 ou mais análises', a: 'Plano de controle', hot: false },
    { r: 'R4', q: 'Saudável com confiança de 70% ou menos', a: 'Refazer a foto', hot: frame >= e3.from + e3.durationInFrames * 0.55 },
  ];
  return (
    <Shell scene={scene} tone="paper" label="Decisão automática" index={6}>
      <Rise start={8}>
        <h2 style={H.title('light')}>Não só diagnostica: diz quando agir</h2>
      </Rise>
      <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.map((row, i) => {
          const p = useEnter(at(scene, 'e2') + i * 6);
          return (
            <div key={row.r} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 36, padding: '24px 36px', borderRadius: 22, background: row.hot ? (row.r === 'R2' ? '#fdeeee' : '#fbf3dc') : '#ffffff', border: `2px solid ${row.hot ? (row.r === 'R2' ? C.redDeep : C.amber) : C.line}`, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: 48, color: row.r === 'R2' ? C.redDeep : C.green, width: 90 }}>{row.r}</div>
              <div style={{ flex: 1, fontSize: 32, color: C.ink }}>{row.q}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: row.r === 'R2' ? C.redDeep : C.leaf }}>{row.a}</div>
              {row.hot ? <Pulse start={row.r === 'R2' ? e3.from : Math.round(e3.from + e3.durationInFrames * 0.55)} color={row.r === 'R2' ? C.redDeep : C.amber} radius={22} /> : null}
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

// ───────────────────────── 7. Processo ─────────────────────────
export const Processo: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const m = (id: string) => at(scene, id);
  const log = [
    ['sim-7-0052', 'Imagem capturada', '15:26:07.980', 'produtor'],
    ['sim-7-0052', 'Diagnóstico por IA', '15:26:10.557', 'gemini'],
    ['sim-7-0052', 'Diagnóstico inconclusivo', '15:26:10.561', 'gemini'],
    ['sim-7-0052', 'Imagem capturada', '15:38:08.885', 'produtor'],
    ['sim-7-0052', 'Diagnóstico por IA', '15:38:12.548', 'gemini'],
    ['sim-7-0052', 'Análise registrada', '15:38:12.588', 'postgres'],
    ['sim-7-0052', 'Alerta gerado', '15:38:13.242', 'motor-de-regras'],
  ];
  const showLog = frame < m('m2');
  return (
    <Shell scene={scene} tone="cream" label="Análise de processo" index={7}>
      {showLog ? (
        <>
          <Rise start={8}>
            <h2 style={H.title('light')}>Cada etapa vira um evento</h2>
          </Rise>
          <div style={{ marginTop: 44, background: '#ffffff', border: `2px solid ${C.line}`, borderRadius: 24, padding: '20px 32px', fontFamily: mono, fontSize: 27 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr', color: C.muted, fontSize: 22, fontWeight: 700, padding: '10px 0', borderBottom: `2px solid ${C.green}` }}>
              <span>case_id</span><span>activity</span><span>timestamp</span><span>resource</span>
            </div>
            {log.map((r, i) => (
              <LogRow key={i} start={m('m1') + 10 + i * 6} r={r} />
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', marginTop: -10 }}>
          <Browser clip="processo" start={m('m2')} startFrom={2.6} playbackRate={0.35} url="localhost:3000/process" width={1120} zoom={[1.02, 1.14]} origin="45% 26%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 30, paddingTop: 10 }}>
            <Stat start={m('m3')} big={<Counter start={m('m3')} to={26} suffix=" ms" />} label="do Kafka ao banco, na execução real" color={C.leaf} />
            <Stat start={m('m4')} big={<Counter start={m('m4')} to={1.1} decimals={1} suffix=" h" />} label="do alerta até o produtor vê-lo (mediana)" color={C.redDeep} pulse />
            <Stat start={m('m4') + Math.round(seg(scene, 'm4').durationInFrames * 0.7)} big={<Counter start={m('m4') + Math.round(seg(scene, 'm4').durationInFrames * 0.7)} to={28} suffix=" h" />} label="nos casos mais lentos (P90)" color={C.redDeep} />
            <Stat start={m('m5')} big={<Counter start={m('m5')} to={21.8} decimals={1} suffix="%" />} label="dos alertas nunca são vistos" color={C.redDeep} pulse />
          </div>
        </div>
      )}
    </Shell>
  );
};

const LogRow: React.FC<{ start: number; r: string[] }> = ({ start, r }) => {
  const p = useEnter(start, 22);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 1fr 1fr', padding: '9px 0', borderBottom: `1px solid ${C.line}`, color: C.ink, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
      <span style={{ color: C.leaf }}>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><span style={{ color: C.muted }}>{r[3]}</span>
    </div>
  );
};

const Stat: React.FC<{ start: number; big: React.ReactNode; label: string; color: string; pulse?: boolean }> = ({ start, big, label, color, pulse }) => {
  const p = useEnter(start);
  return (
    <div style={{ position: 'relative', opacity: p, transform: `translateX(${(1 - p) * 50}px)`, background: '#ffffff', border: `2px solid ${C.line}`, borderRadius: 22, padding: '18px 26px' }}>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 70, lineHeight: 1, color }}>{big}</div>
      <div style={{ fontSize: 26, color: C.muted, marginTop: 8 }}>{label}</div>
      {pulse ? <Pulse start={start + 12} color={color} radius={22} /> : null}
    </div>
  );
};

// ───────────────────────── 8. Melhorias ─────────────────────────
export const Melhorias: React.FC<{ scene: Scene }> = ({ scene }) => {
  const i1 = seg(scene, 'i1');
  const t = (f: number) => i1.from + Math.round(i1.durationInFrames * f);
  const cards = [
    { t: 'Alerta que insiste', b: 'WhatsApp com lembrete e escalonamento para o técnico.', k: 'Mede: tempo até o alerta ser visto', s: t(0.12) },
    { t: 'Foto certa na primeira', b: 'Guia de captura quando a confiança fica abaixo de 70%.', k: 'Mede: % de retrabalho', s: t(0.45) },
    { t: 'IA que não desiste', b: 'Nova tentativa automática quando o diagnóstico falha.', k: 'Mede: casos sem desfecho', s: t(0.75) },
  ];
  return (
    <Shell scene={scene} tone="paper" label="Oportunidades de melhoria" index={8}>
      <Rise start={8}>
        <h2 style={H.title('light')}>O que o processo nos mandou fazer</h2>
      </Rise>
      <div style={{ display: 'flex', gap: 32, marginTop: 64 }}>
        {cards.map((c) => (
          <Card key={c.t} start={c.s} title={c.t} body={c.b}>
            <Rise start={at(scene, 'i2')} y={14}>
              <div style={{ marginTop: 18, display: 'inline-block', fontSize: 24, fontWeight: 700, color: C.leaf, background: '#e6f2ea', padding: '10px 18px', borderRadius: 999 }}>{c.k}</div>
            </Rise>
          </Card>
        ))}
      </div>
    </Shell>
  );
};

// ───────────────────────── 9. Confiabilidade ─────────────────────────
export const Confiavel: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const c1 = seg(scene, 'c1');
  const stages = ['Lint e tipos', 'Testes', 'Segredos', 'Vulnerabilidades', 'CodeQL', 'Build + Trivy', 'Kafka cai e volta', 'Imagens no GHCR'];
  const showActions = frame >= at(scene, 'c3');
  return (
    <Shell scene={scene} tone="dark" label="Confiabilidade · DevSecOps e CI/CD" index={9}>
      {!showActions ? (
        <>
          <Rise start={8}>
            <h2 style={H.title('dark')}>Cada mudança passa pelo pipeline</h2>
          </Rise>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 64, flexWrap: 'nowrap' }}>
            {stages.map((s, i) => (
              <Stage key={s} first={i === 0} label={s} start={c1.from + Math.round((c1.durationInFrames * 0.95 * i) / stages.length)} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 60, marginTop: 70 }}>
            <Rise start={at(scene, 'c2')}>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: 170, lineHeight: 1, color: C.mint }}>
                <Counter start={at(scene, 'c2') + 24} from={44} to={0} frames={42} />
              </div>
            </Rise>
            <Rise start={at(scene, 'c2') + 6}>
              <p style={{ ...H.body('dark', 36), maxWidth: 900, paddingBottom: 24 }}>vulnerabilidades nas dependências de produção, eram 44, incluindo uma falha crítica no Next.js</p>
            </Rise>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <Browser clip="actions" start={at(scene, 'c3')} startFrom={1.2} url="github.com/gugow06/plantguard/actions" width={1480} zoom={[1, 1.06]} origin="60% 50%">
            <Badge start={at(scene, 'c3') + 24} text="Run #9 na main · todos os jobs ✓ · imagens publicadas no GHCR" />
          </Browser>
        </div>
      )}
    </Shell>
  );
};

const Stage: React.FC<{ start: number; label: string; first: boolean }> = ({ start, label, first }) => {
  const frame = useCurrentFrame();
  const p = useEnter(start, 16);
  const ok = frame >= start + 10;
  return (
    <>
      {!first ? <div style={{ width: 22, height: 3, background: ok ? C.mint : '#24533a' }} /> : null}
      <div style={{ flex: 1, textAlign: 'center', padding: '20px 10px', borderRadius: 18, border: `2px solid ${ok ? C.mint : '#24533a'}`, background: ok ? 'rgba(159,220,183,0.12)' : 'transparent', opacity: 0.3 + 0.7 * p, color: C.paper, fontSize: 23, fontWeight: 700 }}>
        <div style={{ fontSize: 30, color: ok ? C.mint : '#3c6b52', marginBottom: 6 }}>{ok ? '✓' : '•'}</div>
        {label}
      </div>
    </>
  );
};

const Badge: React.FC<{ start: number; text: string }> = ({ start, text }) => {
  const p = useEnter(start, 14);
  return (
    <div style={{ position: 'absolute', right: 28, top: 120, background: C.mint, color: C.dark, fontFamily: sans, fontWeight: 700, fontSize: 28, padding: '14px 24px', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      {text}
    </div>
  );
};

// ───────────────────────── 10. Produto ─────────────────────────
export const Produto: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const v2 = seg(scene, 'v2');
  const showValue = frame >= v2.from;
  const words = ['Menos perda.', 'Menos defensivo.', 'Decisão na hora certa.'];
  return (
    <Shell scene={scene} tone={showValue ? 'green' : 'cream'} label="Produto" index={10}>
      {!showValue ? (
        <>
          <Rise start={8}>
            <h2 style={H.title('light')}>Para quem o PlantGuard é feito</h2>
          </Rise>
          <div style={{ display: 'flex', gap: 32, marginTop: 64 }}>
            <Card start={at(scene, 'v1') + 6} title="Pequeno e médio produtor" body="Diagnóstico no celular e alerta automático." />
            <Card start={at(scene, 'v1') + 30} title="Cooperativas" body="Visão consolidada e alertas críticos dos associados." />
            <Card start={at(scene, 'v1') + 56} title="Agrônomos e consultorias" body="Triagem automática e histórico por cultura." />
          </div>
        </>
      ) : (
        <>
          <div style={{ ...H.eyebrow('dark'), marginTop: 20 }}>Proposta de valor</div>
          <div style={{ marginTop: 26 }}>
            {words.map((w, i) => (
              <Rise key={w} start={v2.from + Math.round((v2.durationInFrames * (0.25 + i * 0.22)))} y={50}>
                <div style={{ ...H.title('dark', 116), color: i === 2 ? C.mint : C.paper }}>{w}</div>
              </Rise>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 48, marginTop: 56 }}>
            {[
              ['Produtor', 'Freemium'],
              ['Propriedade e cooperativa', 'Plano com alertas e relatórios'],
              ['Agtechs', 'API cobrada por análise'],
            ].map(([a, b], i) => (
              <Rise key={a} start={at(scene, 'v3') + i * 14} y={20}>
                <div style={{ fontFamily: display, fontSize: 40, fontWeight: 700, color: '#ffffff' }}>{a}</div>
                <div style={{ fontSize: 30, color: C.soft, marginTop: 6 }}>{b}</div>
              </Rise>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
};

// ───────────────────────── 11. Encerramento ─────────────────────────
export const Fim: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const f3 = at(scene, 'f3');
  const { durationInFrames } = useVideoConfig();
  const steps = [
    { t: 'Hoje', b: 'Funciona de ponta a ponta', s: at(scene, 'f1') },
    { t: 'Próximo', b: 'Resposta mais rápida ao alerta', s: at(scene, 'f2') + 10 },
    { t: 'Depois', b: 'Clima e piloto com cooperativa', s: at(scene, 'f2') + 70 },
  ];
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Shell scene={scene} tone="dark" label="Próximos passos" index={11} captions={frame < f3}>
      {frame < f3 ? (
        <>
          <h2 style={H.title('dark')}>Da plataforma pronta ao piloto</h2>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, marginTop: 70 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s.t}>
                {i > 0 ? <Arrow start={s.s} color={C.mint} /> : null}
                <Card start={s.s} title={s.t} body={s.b} tone="dark" />
              </React.Fragment>
            ))}
          </div>
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, opacity: fadeOut }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <Logo start={f3} size={120} />
            <Rise start={f3 + 6}><span style={{ fontFamily: display, fontWeight: 800, fontSize: 110, color: C.paper }}>PlantGuard</span></Rise>
          </div>
          <Rise start={f3 + 26}>
            <div style={{ ...H.title('dark', 72), textAlign: 'center' }}>Proteção inteligente, <span style={{ color: C.mint, fontStyle: 'italic' }}>safra garantida.</span></div>
          </Rise>
          <Rise start={f3 + 46}>
            <div style={{ fontFamily: mono, fontSize: 28, color: C.soft, marginTop: 20 }}>github.com/gugow06/plantguard · FIAP · AgroSmart 2026</div>
          </Rise>
        </div>
      )}
    </Shell>
  );
};
