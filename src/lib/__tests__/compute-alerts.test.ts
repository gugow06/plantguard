import { describe, expect, it } from 'vitest';
import { computeAlerts } from '@/lib/compute-alerts';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';

const rec = (p: Partial<RawAnalysisRecord>): RawAnalysisRecord => ({
  imageName: 'img.jpg',
  status: 'Saudável',
  plantType: 'Tomate',
  pathology: null,
  confidence: 90,
  createdAt: '2026-11-20T10:00:00.000Z',
  ...p,
});

describe('computeAlerts', () => {
  it('agrupa por espécie e ignora "Não identificado" e espécie vazia', () => {
    const alerts = computeAlerts([
      rec({ plantType: 'Tomate' }),
      rec({ plantType: 'Milho' }),
      rec({ plantType: 'Não identificado' }),
      rec({ plantType: null }),
    ]);
    expect(alerts.map((a) => a.plantType).sort()).toEqual(['Milho', 'Tomate']);
  });

  it('ordena críticos primeiro, depois avisos, depois seguros', () => {
    const alerts = computeAlerts([
      rec({ plantType: 'Alface' }),
      rec({ plantType: 'Milho', status: 'Doente', pathology: 'Ferrugem' }),
      rec({ plantType: 'Milho', status: 'Doente', pathology: 'Ferrugem' }),
      rec({ plantType: 'Tomate', status: 'Doente', pathology: 'Requeima' }),
      rec({ plantType: 'Tomate' }),
      rec({ plantType: 'Tomate' }),
    ]);
    expect(alerts.map((a) => a.alert.severity)).toEqual(['critical', 'warning', 'safe']);
    expect(alerts[0].plantType).toBe('Milho');
  });

  it('identifica a patologia dominante e conta as análises', () => {
    const alerts = computeAlerts([
      rec({ status: 'Doente', pathology: 'Requeima' }),
      rec({ status: 'Doente', pathology: 'Requeima' }),
      rec({ status: 'Doente', pathology: 'Requeima' }),
      rec({ status: 'Doente', pathology: 'Septoriose' }),
      rec({ status: 'Inconclusivo' }),
    ]);
    expect(alerts[0].topPathology).toBe('Requeima');
    expect(alerts[0].topPathologyCount).toBe(3);
    expect(alerts[0].totalAnalyses).toBe(5);
    expect(alerts[0].alert.rules.map((r) => r.id)).toContain('R3');
  });

  it('conta saudáveis com confiança ≤ 70% para a R4', () => {
    const alerts = computeAlerts([rec({ confidence: 70 }), rec({ confidence: 71 })]);
    expect(alerts[0].alert.rules.map((r) => r.id)).toEqual(['R4']);
  });

  it('lista vazia não gera alertas', () => {
    expect(computeAlerts([])).toEqual([]);
  });
});
