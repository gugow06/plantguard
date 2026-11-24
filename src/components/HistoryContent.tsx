'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { HistoryTable } from '@/components/HistoryTable';
import { ExportButton } from '@/components/ExportButton';
import { SendReportButton } from '@/components/SendReportButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  imageName: string;
  status: string;
  confidence: number;
  plantType: string | null;
  pathology: string | null;
  description: string;
  recommendations: string;
  createdAt: string;
}

interface HistoryData {
  analyses: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'Saudável', label: 'Saudável' },
  { value: 'Doente', label: 'Doente' },
  { value: 'Inconclusivo', label: 'Inconclusivo' },
];

async function requestHistory(page: number, status: string): Promise<HistoryData> {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status) params.set('status', status);
  const res = await fetch(`/api/history?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error();
  return (await res.json()) as HistoryData;
}

export function HistoryContent() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Carrega a página atual e atualiza em tempo real (a cada 5s), sem recarregar.
  // silent = atualização em background (polling): sem spinner nem toast de erro.
  useEffect(() => {
    let active = true;
    const load = (silent: boolean) =>
      requestHistory(page, statusFilter)
        .then((result) => { if (active) setData(result); })
        .catch(() => { if (active && !silent) toast.error('Erro ao carregar histórico.'); })
        .finally(() => { if (active && !silent) setIsLoading(false); });
    load(false);
    const id = setInterval(() => load(true), 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [page, statusFilter]);

  const fetchAllForExport = useCallback(async () => {
    const params = new URLSearchParams({ page: '1', limit: '1000' });
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/history?${params}`);
    if (!res.ok) throw new Error();

    const result: HistoryData = await res.json();
    return result.analyses;
  }, [statusFilter]);

  const handlePageChange = useCallback((newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setIsLoading(true);
    setStatusFilter(status);
    setPage(1);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.analyses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma análise ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas análises aparecerão aqui após o primeiro diagnóstico.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <ExportButton fetchAllData={fetchAllForExport} />
          <SendReportButton />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {data.total} {data.total === 1 ? 'análise encontrada' : 'análises encontradas'}
      </p>

      {/* Table */}
      <HistoryTable
        analyses={data.analyses}
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
