import { describe, expect, it } from 'vitest';
import { computeAnalytics, type RawAnalysisRecord } from '@/lib/compute-analytics';

const rec = (p: Partial<RawAnalysisRecord>): RawAnalysisRecord => ({
  imageName: 'img.jpg',
  status: 'Saudável',
  plantType: 'Tomate',
  pathology: null,
  confidence: 90,
  createdAt: '2026-11-20T10:00:00.000Z',
  ...p,
});

describe('computeAnalytics', () => {
  it('lista vazia devolve zeros sem quebrar', () => {
    const out = computeAnalytics([]);
    expect(out.summary.totalAnalyses).toBe(0);
    expect(out.summary.healthRate).toBe(0);
    expect(out.summary.averageConfidence).toBe(0);
  });

  it('calcula taxa de saúde, confiança média e contagens distintas', () => {
    const out = computeAnalytics([
      rec({ confidence: 80 }),
      rec({ status: 'Doente', pathology: 'Requeima', confidence: 90 }),
      rec({ status: 'Doente', pathology: 'Oídio', plantType: 'Abóbora', confidence: 70 }),
      rec({ status: 'Inconclusivo', plantType: 'Não identificado', confidence: 40 }),
    ]);
    expect(out.summary.totalAnalyses).toBe(4);
    expect(out.summary.healthRate).toBe(25);
    expect(out.summary.averageConfidence).toBe(70);
    expect(out.summary.distinctPathologies).toBe(2);
    expect(out.summary.distinctPlantTypes).toBe(2);
    const doente = out.statusDistribution.find((s) => s.status === 'Doente');
    expect(doente?.count).toBe(2);
  });
});
