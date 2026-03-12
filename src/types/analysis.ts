export type AnalysisStatus = 'Saudável' | 'Doente' | 'Inconclusivo';

export interface GeminiAnalysisResponse {
  status: AnalysisStatus;
  plantType: string;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  visualEvidence: string[];
}

export interface AnalyzeRequest {
  image: string; // base64
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  imageName: string;
}

export interface AnalyzeResponse {
  id: string;
  status: AnalysisStatus;
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  createdAt: string;
}

export interface HistoryResponse {
  analyses: AnalyzeResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
}
