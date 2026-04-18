'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, FileUp, TrendingUp, X, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { computeAnalytics } from '@/lib/compute-analytics';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';
import type { AnalyticsResponse } from '@/types/analytics';
import { KpiCards } from './KpiCards';
import { StatusPieChart } from './StatusPieChart';
import { PathologyBarChart } from './PathologyBarChart';
import { TimelineChart } from './TimelineChart';
import { PlantTypeChart } from './PlantTypeChart';
import { ConfidenceHistogram } from './ConfidenceHistogram';
import { PlantHealthChart } from './PlantHealthChart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ImportModal } from './ImportModal';

export function AnalyticsDashboard() {
  const { data, isLoading, filters, updateFilters, clearFilters } = useAnalytics();
  const [importOpen, setImportOpen] = useState(false);
  const [importedData, setImportedData] = useState<AnalyticsResponse | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');

  const handleImport = useCallback((records: RawAnalysisRecord[], fileName: string) => {
    const computed = computeAnalytics(records);
    setImportedData(computed);
    setImportedFileName(fileName);
  }, []);

  const clearImport = useCallback(() => {
    setImportedData(null);
    setImportedFileName('');
  }, []);

  // Use imported data if available, otherwise user's own data
  const activeData = importedData ?? data;
  const isViewingImport = !!importedData;

  const plantTypes = useMemo(() => {
    if (!activeData) return [];
    return activeData.plantTypeFrequency.map((p) => p.plantType);
  }, [activeData]);

  if (isLoading && !data && !importedData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!activeData || activeData.summary.totalAnalyses === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-display text-lg font-medium text-foreground">
            Sem dados para análise
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Realize sua primeira análise no Dashboard ou importe dados externos para visualizar.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Importar Dados
          </Button>
          <ImportModal
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onImport={handleImport}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner: viewing imported data */}
      {isViewingImport && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Eye className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Visualizando dados externos
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Arquivo: {importedFileName} — {activeData.summary.totalAnalyses} registros (não salvos no seu perfil)
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
            onClick={clearImport}
          >
            <X className="h-3.5 w-3.5" />
            Voltar aos meus dados
          </Button>
        </div>
      )}

      {/* Filters bar (only for user's own data) */}
      {!isViewingImport && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AnalyticsFilters
            filters={filters}
            onFilterChange={updateFilters}
            onClear={clearFilters}
            plantTypes={plantTypes}
          />
        </div>
      )}

      {/* Import button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <FileUp className="mr-1.5 h-3.5 w-3.5" />
          {isViewingImport ? 'Importar Dados' : 'Importar Dados'}
        </Button>
      </div>

      {/* KPI Cards */}
      <KpiCards summary={activeData.summary} />

      {/* Charts — grid 2x3 simétrico */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusPieChart data={activeData.statusDistribution} />
        <TimelineChart data={activeData.timeline} />
        <PathologyBarChart data={activeData.pathologyFrequency} />
        <PlantTypeChart data={activeData.plantTypeFrequency} />
        <ConfidenceHistogram data={activeData.confidenceDistribution} />
        <PlantHealthChart data={activeData.plantHealthBreakdown} />
      </div>

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
