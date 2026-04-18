'use client';

import { useState, useMemo } from 'react';
import { Loader2, FileUp, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
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
  const { data, isLoading, filters, updateFilters, clearFilters, refetch } = useAnalytics();
  const [importOpen, setImportOpen] = useState(false);

  const plantTypes = useMemo(() => {
    if (!data) return [];
    return data.plantTypeFrequency.map((p) => p.plantType);
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalAnalyses === 0) {
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
            Realize sua primeira análise no Dashboard ou importe dados para visualizar as métricas.
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
            onSuccess={refetch}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnalyticsFilters
          filters={filters}
          onFilterChange={updateFilters}
          onClear={clearFilters}
          plantTypes={plantTypes}
        />
      </div>

      {/* Import button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <FileUp className="mr-1.5 h-3.5 w-3.5" />
          Importar Dados
        </Button>
      </div>

      {/* KPI Cards */}
      <KpiCards summary={data.summary} />

      {/* Charts — grid 2x3 simétrico */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusPieChart data={data.statusDistribution} />
        <TimelineChart data={data.timeline} />
        <PathologyBarChart data={data.pathologyFrequency} />
        <PlantTypeChart data={data.plantTypeFrequency} />
        <ConfidenceHistogram data={data.confidenceDistribution} />
        <PlantHealthChart data={data.plantHealthBreakdown} />
      </div>

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
