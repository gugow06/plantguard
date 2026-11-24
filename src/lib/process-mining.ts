/**
 * Mineração de processos do PlantGuard — funções puras (sem banco), usadas pela
 * página /process, pela API /api/process/* e testadas em __tests__.
 *
 * Conceitos (van der Aalst):
 * - Event log: (caso, atividade, timestamp, recurso)
 * - Variante: sequência de atividades de um caso
 * - DFG (directly-follows graph): quantas vezes a atividade A é seguida por B,
 *   e quanto tempo se espera entre elas (gargalos)
 *
 * Este arquivo não usa o alias "@/" para poder ser importado pelos scripts de infra.
 */

export const ACTIVITIES = {
  CAPTURA: 'Imagem capturada',
  PUBLICADA: 'Publicada no Kafka',
  CONSUMIDA: 'Consumida do tópico',
  DIAGNOSTICO: 'Diagnóstico por IA',
  FALHA_IA: 'Falha no diagnóstico',
  INCONCLUSIVO: 'Diagnóstico inconclusivo',
  REGISTRADA: 'Análise registrada',
  ALERTA: 'Alerta gerado',
  VISUALIZADO: 'Alerta visualizado',
  RELATORIO: 'Relatório enviado',
} as const;

export type Activity = (typeof ACTIVITIES)[keyof typeof ACTIVITIES];

/** Ordem "natural" das atividades, usada para desenhar o mapa do processo. */
export const ACTIVITY_ORDER: string[] = [
  ACTIVITIES.CAPTURA,
  ACTIVITIES.PUBLICADA,
  ACTIVITIES.CONSUMIDA,
  ACTIVITIES.DIAGNOSTICO,
  ACTIVITIES.FALHA_IA,
  ACTIVITIES.INCONCLUSIVO,
  ACTIVITIES.REGISTRADA,
  ACTIVITIES.ALERTA,
  ACTIVITIES.VISUALIZADO,
  ACTIVITIES.RELATORIO,
];

export const START = '▶ Início';
export const END = '■ Fim';

export interface ProcessEventRow {
  caseId: string;
  activity: string;
  timestamp: Date | string;
  resource: string;
  channel: string;
  source: string;
  attributes?: string | null;
}

interface NormalizedEvent extends Omit<ProcessEventRow, 'timestamp'> {
  timestamp: Date;
}

export interface CaseTrace {
  caseId: string;
  channel: string;
  source: string;
  events: NormalizedEvent[];
}

export interface DurationStats {
  count: number;
  meanMs: number;
  medianMs: number;
  p90Ms: number;
  maxMs: number;
}

export interface DfgEdge extends DurationStats {
  from: string;
  to: string;
}

export interface Dfg {
  nodes: { activity: string; count: number }[];
  edges: DfgEdge[];
}

export interface VariantInfo {
  activities: string[];
  count: number;
  share: number; // 0–1
  meanLeadTimeMs: number;
}

export interface ProcessSummary {
  totals: { events: number; cases: number; variants: number; activities: number };
  period: { from: string | null; to: string | null };
  byChannel: Record<string, number>;
  leadTime: DurationStats;
  happyPath: { activities: string[]; share: number };
  rework: { cases: number; share: number };
  aiFailures: { cases: number; share: number };
  alerts: {
    generated: number;
    seen: number;
    neverSeen: number;
    neverSeenShare: number;
    timeToSee: DurationStats;
    seenOutsideWorkHoursShare: number;
  };
  /** Maior espera do ciclo de resposta (captura → alerta visto). */
  bottleneck: DfgEdge | null;
  /** As 5 transições com maior espera mediana (inclui o relatório em lote). */
  topWaits: DfgEdge[];
  dfg: Dfg;
  variants: VariantInfo[];
}

// ───────────────────────── utilidades ─────────────────────────

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function durationStats(values: number[]): DurationStats {
  if (values.length === 0) return { count: 0, meanMs: 0, medianMs: 0, p90Ms: 0, maxMs: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  return {
    count: sorted.length,
    meanMs: Math.round(mean),
    medianMs: percentile(sorted, 50),
    p90Ms: percentile(sorted, 90),
    maxMs: sorted[sorted.length - 1],
  };
}

/** Formata milissegundos de forma legível (ms, s, min, h, d). */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} s`;
  const min = s / 60;
  if (min < 60) return `${min.toFixed(min < 10 ? 1 : 0)} min`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

// ───────────────────────── núcleo ─────────────────────────

/** Agrupa eventos por caso e ordena cada caso por timestamp. */
export function buildTraces(rows: ProcessEventRow[]): CaseTrace[] {
  const map = new Map<string, NormalizedEvent[]>();
  for (const r of rows) {
    const ev: NormalizedEvent = { ...r, timestamp: new Date(r.timestamp) };
    const list = map.get(r.caseId);
    if (list) list.push(ev);
    else map.set(r.caseId, [ev]);
  }
  const order = new Map(ACTIVITY_ORDER.map((a, i) => [a, i]));
  return Array.from(map.entries()).map(([caseId, events]) => {
    events.sort(
      (a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime() ||
        (order.get(a.activity) ?? 99) - (order.get(b.activity) ?? 99),
    );
    return { caseId, channel: events[0].channel, source: events[0].source, events };
  });
}

const leadTimeOf = (t: CaseTrace) =>
  t.events[t.events.length - 1].timestamp.getTime() - t.events[0].timestamp.getTime();

export function discoverVariants(traces: CaseTrace[]): VariantInfo[] {
  const map = new Map<string, { activities: string[]; leadTimes: number[] }>();
  for (const t of traces) {
    const activities = t.events.map((e) => e.activity);
    const key = activities.join(' → ');
    const entry = map.get(key) ?? { activities, leadTimes: [] };
    entry.leadTimes.push(leadTimeOf(t));
    map.set(key, entry);
  }
  const total = traces.length || 1;
  return Array.from(map.values())
    .map((v) => ({
      activities: v.activities,
      count: v.leadTimes.length,
      share: v.leadTimes.length / total,
      meanLeadTimeMs: Math.round(v.leadTimes.reduce((s, x) => s + x, 0) / v.leadTimes.length),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Directly-follows graph com frequência e tempo de espera entre atividades. */
export function discoverDfg(traces: CaseTrace[]): Dfg {
  const nodeCount = new Map<string, number>();
  const edgeDur = new Map<string, number[]>();
  const push = (from: string, to: string, ms: number) => {
    const key = `${from}\u0000${to}`;
    const list = edgeDur.get(key);
    if (list) list.push(ms);
    else edgeDur.set(key, [ms]);
  };

  for (const t of traces) {
    t.events.forEach((e, i) => {
      nodeCount.set(e.activity, (nodeCount.get(e.activity) ?? 0) + 1);
      if (i === 0) push(START, e.activity, 0);
      if (i > 0) {
        const prev = t.events[i - 1];
        push(prev.activity, e.activity, e.timestamp.getTime() - prev.timestamp.getTime());
      }
      if (i === t.events.length - 1) push(e.activity, END, 0);
    });
  }

  const edges: DfgEdge[] = Array.from(edgeDur.entries()).map(([key, values]) => {
    const [from, to] = key.split('\u0000');
    return { from, to, ...durationStats(values) };
  });
  edges.sort((a, b) => b.count - a.count);

  const order = new Map(ACTIVITY_ORDER.map((a, i) => [a, i]));
  const nodes = Array.from(nodeCount.entries())
    .map(([activity, count]) => ({ activity, count }))
    .sort((a, b) => (order.get(a.activity) ?? 99) - (order.get(b.activity) ?? 99));

  return { nodes, edges };
}

const isWorkHours = (d: Date) => {
  // Horário comercial no Brasil (UTC-3): seg–sex, 07h–18h.
  const local = new Date(d.getTime() - 3 * 3600_000);
  const day = local.getUTCDay();
  const h = local.getUTCHours();
  return day >= 1 && day <= 5 && h >= 7 && h < 18;
};

export function summarizeProcess(rows: ProcessEventRow[]): ProcessSummary {
  const traces = buildTraces(rows);
  const variants = discoverVariants(traces);
  const dfg = discoverDfg(traces);

  const timestamps = rows.map((r) => new Date(r.timestamp).getTime()).sort((a, b) => a - b);
  const byChannel: Record<string, number> = {};
  for (const t of traces) byChannel[t.channel] = (byChannel[t.channel] ?? 0) + 1;

  const total = traces.length || 1;
  const reworkCases = traces.filter((t) => {
    const seen = new Set<string>();
    return t.events.some((e) => (seen.has(e.activity) ? true : (seen.add(e.activity), false)));
  }).length;
  const aiFailureCases = traces.filter((t) =>
    t.events.some((e) => e.activity === ACTIVITIES.FALHA_IA),
  ).length;

  const timeToSee: number[] = [];
  let generated = 0;
  let seen = 0;
  let seenOutside = 0;
  for (const t of traces) {
    const alert = t.events.find((e) => e.activity === ACTIVITIES.ALERTA);
    if (!alert) continue;
    generated++;
    const view = t.events.find(
      (e) => e.activity === ACTIVITIES.VISUALIZADO && e.timestamp >= alert.timestamp,
    );
    if (view) {
      seen++;
      timeToSee.push(view.timestamp.getTime() - alert.timestamp.getTime());
      if (!isWorkHours(alert.timestamp)) seenOutside++;
    }
  }

  // Esperas entre atividades reais (ignora início/fim e transições raras, < 2% dos casos).
  const minCount = Math.max(1, Math.floor(traces.length * 0.02));
  const waits = dfg.edges
    .filter((e) => e.from !== START && e.to !== END && e.count >= minCount)
    .sort((a, b) => b.medianMs - a.medianMs);
  // Gargalo do ciclo de resposta: o relatório por e-mail é um envio em lote,
  // fora do ciclo captura → alerta visto, e por isso fica só no ranking.
  const bottleneck = waits.find((e) => e.to !== ACTIVITIES.RELATORIO) ?? null;

  return {
    totals: {
      events: rows.length,
      cases: traces.length,
      variants: variants.length,
      activities: dfg.nodes.length,
    },
    period: {
      from: timestamps.length ? new Date(timestamps[0]).toISOString() : null,
      to: timestamps.length ? new Date(timestamps[timestamps.length - 1]).toISOString() : null,
    },
    byChannel,
    leadTime: durationStats(traces.map(leadTimeOf)),
    happyPath: variants[0]
      ? { activities: variants[0].activities, share: variants[0].share }
      : { activities: [], share: 0 },
    rework: { cases: reworkCases, share: reworkCases / total },
    aiFailures: { cases: aiFailureCases, share: aiFailureCases / total },
    alerts: {
      generated,
      seen,
      neverSeen: generated - seen,
      neverSeenShare: generated ? (generated - seen) / generated : 0,
      timeToSee: durationStats(timeToSee),
      seenOutsideWorkHoursShare: seen ? seenOutside / seen : 0,
    },
    bottleneck,
    topWaits: waits.slice(0, 5),
    dfg,
    variants: variants.slice(0, 10),
  };
}

// ───────────────────────── exportação ─────────────────────────

const csvCell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV no formato padrão de event log (pm4py, Disco, Celonis, ProM). */
export function toEventLogCsv(rows: ProcessEventRow[]): string {
  const header = ['case_id', 'activity', 'timestamp', 'resource', 'channel', 'source'];
  const lines = buildTraces(rows).flatMap((t) =>
    t.events.map((e) =>
      [e.caseId, e.activity, e.timestamp.toISOString(), e.resource, e.channel, e.source]
        .map(csvCell)
        .join(','),
    ),
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}

const xml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** XES (IEEE 1849), o padrão de intercâmbio de event logs. */
export function toEventLogXes(rows: ProcessEventRow[]): string {
  const traces = buildTraces(rows);
  const body = traces
    .map((t) => {
      const events = t.events
        .map(
          (e) =>
            `    <event>\n` +
            `      <string key="concept:name" value="${xml(e.activity)}"/>\n` +
            `      <string key="org:resource" value="${xml(e.resource)}"/>\n` +
            `      <date key="time:timestamp" value="${e.timestamp.toISOString()}"/>\n` +
            `    </event>`,
        )
        .join('\n');
      return (
        `  <trace>\n` +
        `    <string key="concept:name" value="${xml(t.caseId)}"/>\n` +
        `    <string key="channel" value="${xml(t.channel)}"/>\n` +
        `    <string key="source" value="${xml(t.source)}"/>\n` +
        `${events}\n  </trace>`
      );
    })
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<log xes.version="1.0" xes.features="nested-attributes" xmlns="http://www.xes-standard.org/">\n` +
    `  <extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>\n` +
    `  <extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>\n` +
    `  <extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>\n` +
    `${body}\n</log>\n`
  );
}
