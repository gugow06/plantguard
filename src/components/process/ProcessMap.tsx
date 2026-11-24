'use client';

import { ACTIVITIES as A, END, START, formatDuration, type Dfg, type DfgEdge } from '@/lib/process-mining';

/**
 * Mapa do processo (DFG — directly-follows graph) desenhado em SVG.
 * Espessura da seta = frequência; cor = tempo mediano de espera.
 * Layout fixo por raia: câmera (Kafka) em cima, upload (IA) embaixo.
 */

const W = 1280;
const H = 460;
const NODE_W = 138;
const NODE_H = 46;

const POS: Record<string, { x: number; y: number }> = {
  [START]: { x: 55, y: 210 },
  [A.CAPTURA]: { x: 200, y: 210 },
  [A.PUBLICADA]: { x: 375, y: 95 },
  [A.CONSUMIDA]: { x: 550, y: 95 },
  [A.DIAGNOSTICO]: { x: 375, y: 290 },
  [A.FALHA_IA]: { x: 375, y: 400 },
  [A.INCONCLUSIVO]: { x: 550, y: 345 },
  [A.REGISTRADA]: { x: 725, y: 210 },
  [A.ALERTA]: { x: 885, y: 210 },
  [A.VISUALIZADO]: { x: 1050, y: 130 },
  [A.RELATORIO]: { x: 1050, y: 320 },
  [END]: { x: 1215, y: 210 },
};

const isTerminal = (a: string) => a === START || a === END;

function waitColor(ms: number) {
  if (ms < 1000) return '#6b8f71'; // máquina: milissegundos
  if (ms < 60_000) return '#2d7a52'; // segundos
  if (ms < 3_600_000) return '#d4a017'; // minutos
  return '#c1121f'; // horas ou mais: espera humana
}

function splitLabel(label: string): string[] {
  if (label.length <= 16) return [label];
  const words = label.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function edgePath(e: DfgEdge) {
  const a = POS[e.from];
  const b = POS[e.to];
  const halfA = isTerminal(e.from) ? 18 : NODE_W / 2;
  const halfB = isTerminal(e.to) ? 18 : NODE_W / 2;
  if (b.x <= a.x) {
    // Laço de retrabalho (volta para a captura): arco por baixo.
    const sx = a.x;
    const sy = a.y + NODE_H / 2;
    const tx = b.x;
    const ty = b.y + NODE_H / 2;
    const dip = Math.max(sy, ty) + 60;
    return {
      d: `M ${sx} ${sy} C ${sx} ${dip}, ${tx} ${dip}, ${tx} ${ty}`,
      lx: (sx + tx) / 2,
      ly: dip - 12,
      roomy: true,
    };
  }
  const sx = a.x + halfA;
  const tx = b.x - halfB;
  const dx = (tx - sx) / 2;
  return {
    d: `M ${sx} ${a.y} C ${sx + dx} ${a.y}, ${tx - dx} ${b.y}, ${tx} ${b.y}`,
    lx: (sx + tx) / 2,
    ly: (a.y + b.y) / 2 - 6,
    // Arestas curtas e retas não têm espaço para o rótulo sem cobrir os nós.
    roomy: tx - sx > 70 || Math.abs(b.y - a.y) > 40,
  };
}

export function ProcessMap({
  dfg,
  mode,
  bottleneck,
}: {
  dfg: Dfg;
  mode: 'frequency' | 'time';
  bottleneck: DfgEdge | null;
}) {
  const edges = dfg.edges.filter((e) => POS[e.from] && POS[e.to]);
  const maxCount = Math.max(1, ...edges.map((e) => e.count));
  const nodeCount = new Map(dfg.nodes.map((n) => [n.activity, n.count]));
  const isBottleneck = (e: DfgEdge) => bottleneck && e.from === bottleneck.from && e.to === bottleneck.to;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa do processo">
      <defs>
        {['#6b8f71', '#2d7a52', '#d4a017', '#c1121f', '#1b4d34'].map((c) => (
          <marker key={c} id={`arrow-${c.slice(1)}`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {/* raias */}
      <text x={375} y={40} className="fill-muted-foreground" fontSize="12" textAnchor="middle">
        Câmera de campo → Kafka
      </text>
      <text x={375} y={H - 6} className="fill-muted-foreground" fontSize="12" textAnchor="middle">
        Upload no app → IA (Gemini)
      </text>

      {/* arestas */}
      {edges.map((e) => {
        const { d, lx, ly, roomy } = edgePath(e);
        const color = mode === 'time' ? waitColor(e.medianMs) : '#1b4d34';
        const width = 1.2 + 7 * (e.count / maxCount);
        const label = mode === 'time' ? formatDuration(e.medianMs) : String(e.count);
        const hot = isBottleneck(e);
        return (
          <g key={`${e.from}->${e.to}`}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={width}
              strokeOpacity={hot ? 1 : 0.55}
              strokeDasharray={hot ? '0' : undefined}
              markerEnd={`url(#arrow-${color.slice(1)})`}
            />
            {roomy && !isTerminal(e.from) && !isTerminal(e.to) ? (
              <g>
                <rect x={lx - 30} y={ly - 11} width={60} height={18} rx={9} className="fill-background" stroke={hot ? '#c1121f' : 'none'} />
                <text x={lx} y={ly + 2} fontSize="11" textAnchor="middle" fontWeight={hot ? 700 : 500} fill={hot ? '#c1121f' : 'currentColor'}>
                  {label}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}

      {/* nós */}
      {Object.entries(POS).map(([activity, p]) => {
        if (isTerminal(activity)) {
          return (
            <g key={activity}>
              <circle cx={p.x} cy={p.y} r={16} fill={activity === START ? '#2d7a52' : '#1b4d34'} />
              <text x={p.x} y={p.y + 34} fontSize="11" textAnchor="middle" className="fill-muted-foreground">
                {activity === START ? 'Início' : 'Fim'}
              </text>
            </g>
          );
        }
        const count = nodeCount.get(activity);
        const present = count !== undefined;
        const lines = splitLabel(activity);
        return (
          <g key={activity} opacity={present ? 1 : 0.35}>
            <rect
              x={p.x - NODE_W / 2}
              y={p.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              className="fill-card"
              stroke="#1b4d34"
              strokeWidth={1.5}
            />
            {lines.map((l, i) => (
              <text
                key={l}
                x={p.x}
                y={p.y + (lines.length === 1 ? 4 : i === 0 ? -4 : 10)}
                fontSize="12"
                fontWeight={600}
                textAnchor="middle"
                className="fill-foreground"
              >
                {l}
              </text>
            ))}
            <text x={p.x} y={p.y + NODE_H / 2 + 14} fontSize="11" textAnchor="middle" className="fill-muted-foreground">
              {present ? `${count} eventos` : 'sem eventos'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
