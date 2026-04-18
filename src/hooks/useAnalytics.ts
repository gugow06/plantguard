'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AnalyticsResponse, AnalyticsFilters } from '@/types/analytics';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const fetchAnalytics = useCallback(async (f: AnalyticsFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.startDate) params.set('startDate', f.startDate);
      if (f.endDate) params.set('endDate', f.endDate);
      if (f.status) params.set('status', f.status);
      if (f.plantType) params.set('plantType', f.plantType);

      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error();

      const result: AnalyticsResponse = await res.json();
      setData(result);
    } catch {
      toast.error('Erro ao carregar analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(filters);
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
