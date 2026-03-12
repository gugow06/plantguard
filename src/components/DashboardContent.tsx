'use client';

import { UploadZone } from '@/components/UploadZone';
import { AnalysisCard } from '@/components/AnalysisCard';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { AnalysisStatus } from '@/types/analysis';

export function DashboardContent() {
  const { analyze, isLoading, result, reset } = useAnalysis();

  return (
    <div className="space-y-8">
      <UploadZone onUpload={analyze} isLoading={isLoading} />

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Resultado da Análise
            </h2>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Nova análise
            </Button>
          </div>

          <AnalysisCard
            status={result.status as AnalysisStatus}
            plantType={result.plantType}
            pathology={result.pathology}
            confidence={result.confidence}
            description={result.description}
            recommendations={result.recommendations}
            visualEvidence={result.visualEvidence}
          />
        </div>
      )}
    </div>
  );
}
