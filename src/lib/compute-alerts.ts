import { evaluatePlantAlert } from '@/lib/decision-rules';
import type { AlertRecord } from '@/lib/decision-rules';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';

export function computeAlerts(records: RawAnalysisRecord[]): AlertRecord[] {
  const plantMap = new Map<
    string,
    {
      saudavel: number;
      doente: number;
      inconclusivo: number;
      lowConfidenceSaudavel: number;
      pathologyCounts: Map<string, number>;
      lastSeenAt: string;
    }
  >();

  for (const r of records) {
    if (!r.plantType || r.plantType === 'Não identificado') continue;

    const existing = plantMap.get(r.plantType) ?? {
      saudavel: 0,
      doente: 0,
      inconclusivo: 0,
      lowConfidenceSaudavel: 0,
      pathologyCounts: new Map<string, number>(),
      lastSeenAt: r.createdAt ?? new Date().toISOString(),
    };

    if (r.status === 'Saudável') {
      existing.saudavel++;
      if (r.confidence <= 70) existing.lowConfidenceSaudavel++;
    } else if (r.status === 'Doente') {
      existing.doente++;
    } else {
      existing.inconclusivo++;
    }

    if (r.pathology) {
      existing.pathologyCounts.set(
        r.pathology,
        (existing.pathologyCounts.get(r.pathology) ?? 0) + 1,
      );
    }

    plantMap.set(r.plantType, existing);
  }

  const alertRecords: AlertRecord[] = [];

  for (const [plantType, data] of plantMap.entries()) {
    const breakdown = {
      plantType,
      saudavel: data.saudavel,
      doente: data.doente,
      inconclusivo: data.inconclusivo,
    };

    let topPathology: string | null = null;
    let topPathologyCount = 0;
    for (const [path, count] of data.pathologyCounts.entries()) {
      if (count > topPathologyCount) {
        topPathology = path;
        topPathologyCount = count;
      }
    }

    const alert = evaluatePlantAlert(breakdown, topPathology, topPathologyCount, data.lowConfidenceSaudavel);

    alertRecords.push({
      plantType,
      alert,
      topPathology,
      topPathologyCount,
      lastSeenAt: data.lastSeenAt,
      totalAnalyses: data.saudavel + data.doente + data.inconclusivo,
    });
  }

  alertRecords.sort((a, b) => {
    const order = { critical: 0, warning: 1, safe: 2 };
    return order[a.alert.severity] - order[b.alert.severity];
  });

  return alertRecords;
}
