import { describe, expect, it } from 'vitest';
import { evaluatePlantAlert } from '@/lib/decision-rules';

const bd = (saudavel: number, doente: number, inconclusivo = 0) => ({
  plantType: 'Tomate',
  saudavel,
  doente,
  inconclusivo,
});

const ids = (alert: ReturnType<typeof evaluatePlantAlert>) => alert.rules.map((r) => r.id);

describe('evaluatePlantAlert — regras de decisão R1–R4', () => {
  it('planta só com análises saudáveis e confiantes: nenhum alerta (safe)', () => {
    const alert = evaluatePlantAlert(bd(5, 0));
    expect(alert.triggered).toBe(false);
    expect(alert.severity).toBe('safe');
    expect(alert.rules).toEqual([]);
    expect(alert.recommendation).toMatch(/saudável/i);
  });

  it('sem análises: não divide por zero e fica safe', () => {
    const alert = evaluatePlantAlert(bd(0, 0, 0));
    expect(alert.diseaseRate).toBe(0);
    expect(alert.severity).toBe('safe');
  });

  it('R1: uma análise doente já dispara alerta de aviso', () => {
    const alert = evaluatePlantAlert(bd(9, 1));
    expect(ids(alert)).toEqual(['R1']);
    expect(alert.severity).toBe('warning');
  });

  it('R2: taxa de doença exatamente em 50% é crítica', () => {
    const alert = evaluatePlantAlert(bd(2, 2));
    expect(ids(alert)).toContain('R2');
    expect(alert.severity).toBe('critical');
    expect(alert.diseaseRate).toBe(0.5);
  });

  it('R2: logo abaixo de 50% não é crítica', () => {
    const alert = evaluatePlantAlert(bd(51, 49));
    expect(ids(alert)).not.toContain('R2');
    expect(alert.severity).toBe('warning');
  });

  it('R2: inconclusivas entram no denominador', () => {
    // 2 doentes em 5 (2 saudáveis + 1 inconclusiva) = 40%
    const alert = evaluatePlantAlert(bd(2, 2, 1));
    expect(alert.diseaseRate).toBeCloseTo(0.4);
    expect(alert.severity).toBe('warning');
  });

  it('R3: mesma patologia em 3 análises aciona plano de controle', () => {
    const alert = evaluatePlantAlert(bd(10, 3), 'Requeima', 3);
    expect(ids(alert)).toContain('R3');
    expect(alert.rules.find((r) => r.id === 'R3')?.description).toMatch(/Requeima/);
    expect(alert.recommendation).toMatch(/plano de controle/i);
  });

  it('R3: 2 ocorrências ou patologia nula não disparam', () => {
    expect(ids(evaluatePlantAlert(bd(10, 2), 'Requeima', 2))).not.toContain('R3');
    expect(ids(evaluatePlantAlert(bd(10, 0), null, 5))).not.toContain('R3');
  });

  it('R4: saudável com baixa confiança gera diagnóstico incerto', () => {
    const alert = evaluatePlantAlert(bd(5, 0), null, 0, 2);
    expect(ids(alert)).toEqual(['R4']);
    expect(alert.severity).toBe('warning');
    expect(alert.recommendation).toMatch(/nova análise/i);
  });

  it('R2 tem precedência na recomendação e no prognóstico', () => {
    const alert = evaluatePlantAlert(bd(1, 3), 'Oídio', 3, 1);
    expect(ids(alert)).toEqual(['R1', 'R2', 'R3', 'R4']);
    expect(alert.severity).toBe('critical');
    expect(alert.recommendation).toMatch(/crítica/i);
    expect(alert.prognosis).toMatch(/intervenção imediata/i);
  });
});
