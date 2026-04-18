export interface AnalyticsSummary {
  totalAnalyses: number;
  healthRate: number;
  distinctPathologies: number;
  averageConfidence: number;
  distinctPlantTypes: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface PathologyFrequency {
  pathology: string;
  count: number;
}

export interface TimelineEntry {
  date: string;
  saudavel: number;
  doente: number;
  inconclusivo: number;
}

export interface PlantTypeFrequency {
  plantType: string;
  count: number;
}

export interface ConfidenceDistribution {
  range: string;
  label: string;
  count: number;
}

export interface PlantHealthBreakdown {
  plantType: string;
  saudavel: number;
  doente: number;
  inconclusivo: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  statusDistribution: StatusDistribution[];
  pathologyFrequency: PathologyFrequency[];
  timeline: TimelineEntry[];
  plantTypeFrequency: PlantTypeFrequency[];
  confidenceDistribution: ConfidenceDistribution[];
  plantHealthBreakdown: PlantHealthBreakdown[];
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  plantType?: string;
}

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}
