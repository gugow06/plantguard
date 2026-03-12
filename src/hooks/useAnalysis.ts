'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { GeminiAnalysisResponse } from '@/types/analysis';

interface AnalysisResult extends GeminiAnalysisResponse {
  id: string;
  createdAt: string;
}

export function useAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async (file: File) => {
    setIsLoading(true);
    setResult(null);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
          imageName: file.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Erro ao analisar imagem.');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      toast.success('Análise concluída!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao analisar imagem.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { analyze, isLoading, result, reset };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
