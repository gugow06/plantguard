'use client';

import { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AnalyticsFilters as FiltersType } from '@/types/analytics';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Saudável', label: 'Saudável' },
  { value: 'Doente', label: 'Doente' },
  { value: 'Inconclusivo', label: 'Inconclusivo' },
];

interface AnalyticsFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: Partial<FiltersType>) => void;
  onClear: () => void;
  plantTypes: string[];
}

export function AnalyticsFilters({
  filters,
  onFilterChange,
  onClear,
  plantTypes,
}: AnalyticsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = !!(filters.startDate || filters.endDate || filters.status || filters.plantType);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Toggle + quick status filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                !
              </span>
            )}
          </Button>

          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={(filters.status ?? '') === opt.value ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => onFilterChange({ status: opt.value || undefined })}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-border pt-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Data início
              </label>
              <input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
                className={cn(
                  'h-9 rounded-lg border border-input bg-background px-3 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Data fim
              </label>
              <input
                type="date"
                value={filters.endDate ?? ''}
                onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
                className={cn(
                  'h-9 rounded-lg border border-input bg-background px-3 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                )}
              />
            </div>

            {plantTypes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tipo de Planta
                </label>
                <select
                  value={filters.plantType ?? ''}
                  onChange={(e) => onFilterChange({ plantType: e.target.value || undefined })}
                  className={cn(
                    'h-9 rounded-lg border border-input bg-background px-3 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  <option value="">Todas</option>
                  {plantTypes.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
