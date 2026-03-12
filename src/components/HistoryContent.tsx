'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { HistoryTable } from '@/components/HistoryTable';
import { ExportButton } from '@/components/ExportButton';
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

export function HistoryContent() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchHistory = useCallback(async (p: number, status: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '10' });
      if (status) params.set('status', status);

      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) throw new Error();

      const result: HistoryData = await res.json();
      setData(result);
    } catch {
      toast.error('Erro ao carregar histórico.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page, statusFilter);
  }, [page, statusFilter, fetchHistory]);

  const fetchAllForExport = useCallback(async () => {
    const params = new URLSearchParams({ page: '1', limit: '1000' });
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/history?${params}`);
    if (!res.ok) throw new Error();

    const result: HistoryData = await res.json();
    return result.analyses;
  }, [statusFilter]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
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
        <ExportButton fetchAllData={fetchAllForExport} />
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
