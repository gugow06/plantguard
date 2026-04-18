import type { AnalyticsResponse } from '@/types/analytics';

export interface RawAnalysisRecord {
  imageName: string;
  status: string;
  plantType?: string | null;
  pathology?: string | null;
  confidence: number;
  description?: string;
  recommendations?: string;
  createdAt?: string;
}

export function computeAnalytics(records: RawAnalysisRecord[]): AnalyticsResponse {
  const total = records.length;

  // Summary
  const healthyCount = records.filter((r) => r.status === 'Saudável').length;
  const healthRate = total > 0 ? Math.round((healthyCount / total) * 1000) / 10 : 0;
  const distinctPathologies = new Set(
    records.filter((r) => r.pathology).map((r) => r.pathology),
  ).size;
  const averageConfidence =
    total > 0
      ? Math.round((records.reduce((sum, r) => sum + r.confidence, 0) / total) * 10) / 10
      : 0;
  const distinctPlantTypes = new Set(
    records.filter((r) => r.plantType && r.plantType !== 'Não identificado').map((r) => r.plantType),
  ).size;

  // Status distribution
  const statusMap = new Map<string, number>();
  for (const r of records) {
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
  }
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Pathology frequency (top 10)
  const pathMap = new Map<string, number>();
  for (const r of records) {
    if (r.pathology) {
      pathMap.set(r.pathology, (pathMap.get(r.pathology) ?? 0) + 1);
    }
  }
  const pathologyFrequency = Array.from(pathMap.entries())
    .map(([pathology, count]) => ({ pathology, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Timeline (grouped by day)
  const timelineMap = new Map<string, { saudavel: number; doente: number; inconclusivo: number }>();
  for (const r of records) {
    const day = r.createdAt
      ? new Date(r.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const entry = timelineMap.get(day) ?? { saudavel: 0, doente: 0, inconclusivo: 0 };
    if (r.status === 'Saudável') entry.saudavel++;
    else if (r.status === 'Doente') entry.doente++;
    else entry.inconclusivo++;
    timelineMap.set(day, entry);
  }
  const timeline = Array.from(timelineMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Plant type frequency (top 10)
  const plantMap = new Map<string, number>();
  for (const r of records) {
    if (r.plantType && r.plantType !== 'Não identificado') {
      plantMap.set(r.plantType, (plantMap.get(r.plantType) ?? 0) + 1);
    }
  }
  const plantTypeFrequency = Array.from(plantMap.entries())
    .map(([plantType, count]) => ({ plantType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Confidence distribution
  const confidenceRanges = [
    { range: '0-29', label: '0-29%', min: 0, max: 29 },
    { range: '30-49', label: '30-49%', min: 30, max: 49 },
    { range: '50-69', label: '50-69%', min: 50, max: 69 },
    { range: '70-89', label: '70-89%', min: 70, max: 89 },
    { range: '90-100', label: '90-100%', min: 90, max: 100 },
  ];
  const confidenceDistribution = confidenceRanges.map(({ range, label, min, max }) => ({
    range,
    label,
    count: records.filter((r) => r.confidence >= min && r.confidence <= max).length,
  }));

  // Plant health breakdown (top 10)
  const plantHealthMap = new Map<string, { saudavel: number; doente: number; inconclusivo: number }>();
  for (const r of records) {
    if (r.plantType && r.plantType !== 'Não identificado') {
      const entry = plantHealthMap.get(r.plantType) ?? { saudavel: 0, doente: 0, inconclusivo: 0 };
      if (r.status === 'Saudável') entry.saudavel++;
      else if (r.status === 'Doente') entry.doente++;
      else entry.inconclusivo++;
      plantHealthMap.set(r.plantType, entry);
    }
  }
  const plantHealthBreakdown = Array.from(plantHealthMap.entries())
    .map(([plantType, counts]) => ({ plantType, ...counts }))
    .sort((a, b) => (b.saudavel + b.doente + b.inconclusivo) - (a.saudavel + a.doente + a.inconclusivo))
    .slice(0, 10);

  return {
    summary: {
      totalAnalyses: total,
      healthRate,
      distinctPathologies,
      averageConfidence,
      distinctPlantTypes,
    },
    statusDistribution,
    pathologyFrequency,
    timeline,
    plantTypeFrequency,
    confidenceDistribution,
    plantHealthBreakdown,
  };
}
