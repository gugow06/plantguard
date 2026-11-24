import type { PlantHealthBreakdown } from '@/types/analytics';

export type AlertSeverity = 'safe' | 'warning' | 'critical';

export interface PlantAlert {
  triggered: boolean;
  severity: AlertSeverity;
  diseaseRate: number;
  rules: TriggeredRule[];
  recommendation: string;
  prognosis: string;
}

export interface TriggeredRule {
  id: string;
  label: string;
  description: string;
}

export interface AlertRecord {
  plantType: string;
  alert: PlantAlert;
  topPathology: string | null;
  topPathologyCount: number;
  lastSeenAt: string | null;
  totalAnalyses: number;
}

// Rule 1 — Any Disease
// SE doente > 0 ENTÃO emitir alerta de doença
function ruleAnyDisease(breakdown: PlantHealthBreakdown): TriggeredRule | null {
  if (breakdown.doente > 0) {
    return {
      id: 'R1',
      label: 'Doença Detectada',
      description: `${breakdown.doente} análise(s) indicam doença nesta espécie.`,
    };
  }
  return null;
}

// Rule 2 — Critical Disease Threshold ≥50%
// SE (doente / total) >= 0.50 ENTÃO intervenção urgente
function ruleCriticalThreshold(breakdown: PlantHealthBreakdown): TriggeredRule | null {
  const total = breakdown.saudavel + breakdown.doente + breakdown.inconclusivo;
  if (total === 0) return null;
  const rate = breakdown.doente / total;
  if (rate >= 0.50) {
    return {
      id: 'R2',
      label: 'Intervenção Urgente',
      description: `${Math.round(rate * 100)}% das análises indicam doença grave (limite crítico: 50%).`,
    };
  }
  return null;
}

// Rule 3 — Dominant Pathology (same pathology ≥3 analyses)
// SE mesma patologia aparece em >= 3 análises ENTÃO acionar plano de controle
function ruleDominantPathology(topPathologyCount: number, pathologyName: string | null): TriggeredRule | null {
  if (!pathologyName || topPathologyCount < 3) return null;
  return {
    id: 'R3',
    label: 'Acionar Plano de Controle',
    description: `"${pathologyName}" detectada em ${topPathologyCount} análises consecutivas (limite: 3).`,
  };
}

// Rule 4 — Low Confidence Healthy (confiança ≤70%)
// SE status=Saudável E confiança <=70% ENTÃO diagnóstico incerto → alerta
function ruleLowConfidenceHealthy(lowConfidenceSaudavel: number): TriggeredRule | null {
  if (lowConfidenceSaudavel > 0) {
    return {
      id: 'R4',
      label: 'Diagnóstico Incerto',
      description: `${lowConfidenceSaudavel} análise(s) saudável com confiança ≤70% — resultado pode ser impreciso.`,
    };
  }
  return null;
}

function buildRecommendation(rules: TriggeredRule[], topPathology: string | null, diseaseRate: number): string {
  const hasR2 = rules.some((r) => r.id === 'R2');
  const hasR3 = rules.some((r) => r.id === 'R3');
  const hasR4 = rules.some((r) => r.id === 'R4');

  if (hasR2 && hasR3) {
    return `Situação crítica: ${topPathology ?? 'doença'} em ${Math.round(diseaseRate * 100)}% das plantas. Aplicar tratamento fungicida/bactericida imediatamente e isolar área afetada.`;
  }
  if (hasR2) {
    return `Mais da metade das análises indicam infecção. Realizar inspeção presencial urgente e consultar engenheiro agrônomo para definir tratamento.`;
  }
  if (hasR3) {
    return `Patologia recorrente detectada. Iniciar plano de controle integrado: rotação de culturas, remoção de plantas infectadas e aplicação preventiva.`;
  }
  if (hasR4) {
    return `Algumas análises saudáveis apresentaram baixa confiança (≤70%). Recomenda-se nova análise com imagens de melhor qualidade para confirmar o diagnóstico.`;
  }
  return `Doença detectada. Monitore com frequência e aplique medidas preventivas antes que a infecção se espalhe.`;
}

function buildPrognosis(severity: AlertSeverity, diseaseRate: number): string {
  if (severity === 'critical') {
    return `Se as condições atuais forem mantidas, a tendência é de aumento da infecção para toda a plantação. Sem intervenção imediata, perdas de colheita podem superar ${Math.round(diseaseRate * 100 + 15)}%.`;
  }
  if (severity === 'warning') {
    return `Com manejo adequado, é possível reduzir a taxa de infecção abaixo de 15% em 2-3 semanas. Sem ação, a tendência é de progressão para o nível crítico.`;
  }
  return `Planta em condições aceitáveis. Continue o monitoramento regular.`;
}

export function evaluatePlantAlert(
  breakdown: PlantHealthBreakdown,
  topPathology: string | null = null,
  topPathologyCount = 0,
  lowConfidenceSaudavel = 0,
): PlantAlert {
  const total = breakdown.saudavel + breakdown.doente + breakdown.inconclusivo;
  const diseaseRate = total > 0 ? breakdown.doente / total : 0;

  // Evaluate all rules independently
  // Boolean logic:
  // triggered = R1 OR R2 OR R3 OR R4
  // critical  = R2
  // safe      = NOT R1 AND NOT R2 AND NOT R3 AND NOT R4
  const r1 = ruleAnyDisease(breakdown);
  const r2 = ruleCriticalThreshold(breakdown);
  const r3 = ruleDominantPathology(topPathologyCount, topPathology);
  const r4 = ruleLowConfidenceHealthy(lowConfidenceSaudavel);

  const triggeredRules = [r1, r2, r3, r4].filter((r): r is TriggeredRule => r !== null);

  const triggered = triggeredRules.length > 0;
  const isCritical = r2 !== null;
  const severity: AlertSeverity = !triggered ? 'safe' : isCritical ? 'critical' : 'warning';

  const recommendation = triggered
    ? buildRecommendation(triggeredRules, topPathology, diseaseRate)
    : 'Planta saudável. Manter monitoramento periódico.';

  const prognosis = buildPrognosis(severity, diseaseRate);

  return { triggered, severity, diseaseRate, rules: triggeredRules, recommendation, prognosis };
}
