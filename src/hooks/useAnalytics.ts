'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AnalyticsResponse, AnalyticsFilters } from '@/types/analytics';

async function requestAnalytics(f: AnalyticsFilters): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (f.startDate) params.set('startDate', f.startDate);
  if (f.endDate) params.set('endDate', f.endDate);
  if (f.status) params.set('status', f.status);
  if (f.plantType) params.set('plantType', f.plantType);
  const res = await fetch(`/api/analytics?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error();
  return (await res.json()) as AnalyticsResponse;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const [reloadKey, setReloadKey] = useState(0);

  // Carrega e atualiza em tempo real (a cada 5s), sem recarregar a página.
  // silent = atualização em background (polling): sem spinner nem toast de erro.
  useEffect(() => {
    let active = true;
    const load = (silent: boolean) =>
      requestAnalytics(filters)
        .then((result) => { if (active) setData(result); })
        .catch(() => { if (active && !silent) toast.error('Erro ao carregar analytics.'); })
        .finally(() => { if (active && !silent) setIsLoading(false); });
    load(false);
    const id = setInterval(() => load(true), 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [filters, reloadKey]);

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setIsLoading(true);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setIsLoading(true);
    setFilters({});
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { data, isLoading, filters, updateFilters, clearFilters, refetch };
}
