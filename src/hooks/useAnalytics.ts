'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AnalyticsResponse, AnalyticsFilters } from '@/types/analytics';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // silent = atualização em background (polling); não mostra spinner nem toast de erro
  const fetchAnalytics = useCallback(async (f: AnalyticsFilters, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.startDate) params.set('startDate', f.startDate);
      if (f.endDate) params.set('endDate', f.endDate);
      if (f.status) params.set('status', f.status);
      if (f.plantType) params.set('plantType', f.plantType);

      const res = await fetch(`/api/analytics?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();

      const result: AnalyticsResponse = await res.json();
      setData(result);
    } catch {
      if (!silent) toast.error('Erro ao carregar analytics.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(filters);
  }, [filters, fetchAnalytics]);

  // Atualização em tempo real (a cada 5s), sem recarregar a página
  useEffect(() => {
    const id = setInterval(() => fetchAnalytics(filters, true), 5000);
    return () => clearInterval(id);
  }, [filters, fetchAnalytics]);

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const refetch = useCallback(() => {
    fetchAnalytics(filters);
  }, [filters, fetchAnalytics]);

  return { data, isLoading, filters, updateFilters, clearFilters, refetch };
}
