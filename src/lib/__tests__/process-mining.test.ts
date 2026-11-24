import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES as A,
  END,
  START,
  buildTraces,
  discoverDfg,
  discoverVariants,
  durationStats,
  formatDuration,
  percentile,
  summarizeProcess,
  toEventLogCsv,
  toEventLogXes,
  type ProcessEventRow,
} from '@/lib/process-mining';

const T0 = Date.parse('2026-11-23T13:00:00.000Z'); // segunda, 10h em Brasília
const ev = (caseId: string, activity: string, offsetMs: number, channel = 'camera'): ProcessEventRow => ({
  caseId,
  activity,
  timestamp: new Date(T0 + offsetMs).toISOString(),
  resource: 'r',
  channel,
  source: 'simulado',
});

const MIN = 60_000;
const HOUR = 60 * MIN;

// c1, c2: caminho feliz com alerta visto (30 min e 2 h)
// c3: saudável, sem alerta
// c4: upload com falha na IA e retrabalho por inconclusivo; alerta nunca visto
const log: ProcessEventRow[] = [
  ev('c1', A.CAPTURA, 0), ev('c1', A.PUBLICADA, 100), ev('c1', A.CONSUMIDA, 200),
  ev('c1', A.REGISTRADA, 250), ev('c1', A.ALERTA, 300), ev('c1', A.VISUALIZADO, 300 + 30 * MIN),
  ev('c2', A.CAPTURA, 0), ev('c2', A.PUBLICADA, 100), ev('c2', A.CONSUMIDA, 200),
  ev('c2', A.REGISTRADA, 250), ev('c2', A.ALERTA, 300), ev('c2', A.VISUALIZADO, 300 + 2 * HOUR),
  ev('c3', A.CAPTURA, 0), ev('c3', A.PUBLICADA, 100), ev('c3', A.CONSUMIDA, 200), ev('c3', A.REGISTRADA, 250),
  ev('c4', A.CAPTURA, 0, 'upload'), ev('c4', A.FALHA_IA, 20_000, 'upload'),
  ev('c4', A.DIAGNOSTICO, 30_000, 'upload'), ev('c4', A.INCONCLUSIVO, 30_001, 'upload'),
  ev('c4', A.CAPTURA, 10 * MIN, 'upload'), ev('c4', A.DIAGNOSTICO, 10 * MIN + 5000, 'upload'),
  ev('c4', A.REGISTRADA, 10 * MIN + 5100, 'upload'), ev('c4', A.ALERTA, 10 * MIN + 5200, 'upload'),
];

describe('estatísticas', () => {
  it('percentil e durationStats', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
    expect(percentile([], 50)).toBe(0);
    const s = durationStats([10, 20, 30, 40]);
    expect(s).toMatchObject({ count: 4, meanMs: 25, medianMs: 20, maxMs: 40 });
    expect(durationStats([]).count).toBe(0);
  });

  it('formatDuration escolhe a unidade', () => {
    expect(formatDuration(250)).toBe('250 ms');
    expect(formatDuration(5_500)).toBe('5.5 s');
    expect(formatDuration(30 * MIN)).toBe('30 min');
    expect(formatDuration(3 * HOUR)).toBe('3.0 h');
    expect(formatDuration(72 * HOUR)).toBe('3.0 d');
  });
});

describe('descoberta do processo', () => {
  it('agrupa por caso em ordem temporal', () => {
    const traces = buildTraces([...log].reverse());
    expect(traces).toHaveLength(4);
    const c1 = traces.find((t) => t.caseId === 'c1')!;
    expect(c1.events.map((e) => e.activity)[0]).toBe(A.CAPTURA);
    expect(c1.events.at(-1)!.activity).toBe(A.VISUALIZADO);
  });

  it('variantes ordenadas por frequência', () => {
    const variants = discoverVariants(buildTraces(log));
    expect(variants).toHaveLength(3);
    expect(variants[0].count).toBe(2);
    expect(variants[0].share).toBe(0.5);
    expect(variants[0].activities.at(-1)).toBe(A.VISUALIZADO);
  });

  it('DFG conta transições e mede a espera', () => {
    const dfg = discoverDfg(buildTraces(log));
    const edge = (from: string, to: string) => dfg.edges.find((e) => e.from === from && e.to === to);
    expect(edge(START, A.CAPTURA)?.count).toBe(4);
    expect(edge(A.CAPTURA, A.PUBLICADA)).toMatchObject({ count: 3, medianMs: 100 });
    expect(edge(A.ALERTA, A.VISUALIZADO)).toMatchObject({ count: 2, maxMs: 2 * HOUR });
    expect(edge(A.INCONCLUSIVO, A.CAPTURA)?.count).toBe(1); // laço de retrabalho
    expect(edge(A.REGISTRADA, END)?.count).toBe(1);
    expect(dfg.nodes.find((n) => n.activity === A.CAPTURA)?.count).toBe(5);
  });
});

describe('summarizeProcess', () => {
  const s = summarizeProcess(log);

  it('totais, canais e caminho feliz', () => {
    expect(s.totals).toMatchObject({ cases: 4, events: log.length, variants: 3 });
    expect(s.byChannel).toEqual({ camera: 3, upload: 1 });
    expect(s.happyPath.share).toBe(0.5);
  });

  it('retrabalho e falhas da IA', () => {
    expect(s.rework.cases).toBe(1);
    expect(s.aiFailures.cases).toBe(1);
    expect(s.aiFailures.share).toBe(0.25);
  });

  it('alertas: gerados, vistos, nunca vistos e tempo até ver', () => {
    expect(s.alerts).toMatchObject({ generated: 3, seen: 2, neverSeen: 1 });
    expect(s.alerts.neverSeenShare).toBeCloseTo(1 / 3);
    expect(s.alerts.timeToSee.medianMs).toBe(30 * MIN);
    expect(s.alerts.seenOutsideWorkHoursShare).toBe(0);
  });

  it('gargalo é a espera entre o alerta e a visualização', () => {
    expect(s.bottleneck?.from).toBe(A.ALERTA);
    expect(s.bottleneck?.to).toBe(A.VISUALIZADO);
    expect(s.topWaits[0].from).toBe(A.ALERTA);
  });

  it('relatório em lote fica fora do gargalo, mas entra no ranking', () => {
    const withReport = summarizeProcess([...log, ev('c3', A.RELATORIO, 3 * 24 * HOUR)]);
    expect(withReport.bottleneck?.to).toBe(A.VISUALIZADO);
    expect(withReport.topWaits[0].to).toBe(A.RELATORIO);
  });

  it('log vazio não quebra', () => {
    const empty = summarizeProcess([]);
    expect(empty.totals.cases).toBe(0);
    expect(empty.bottleneck).toBeNull();
    expect(empty.period.from).toBeNull();
  });
});

describe('exportação', () => {
  it('CSV com cabeçalho padrão e escape', () => {
    const csv = toEventLogCsv([{ ...ev('c,1', A.CAPTURA, 0), resource: 'a"b' }]);
    const [header, line] = csv.trim().split('\n');
    expect(header).toBe('case_id,activity,timestamp,resource,channel,source');
    expect(line.startsWith('"c,1",Imagem capturada,')).toBe(true);
    expect(line).toContain('"a""b"');
  });

  it('XES com traces e eventos', () => {
    const xes = toEventLogXes(log.filter((e) => e.caseId === 'c3'));
    expect(xes).toContain('<log xes.version="1.0"');
    expect((xes.match(/<event>/g) ?? []).length).toBe(4);
    expect(xes).toContain('value="Consumida do tópico"');
  });
});
