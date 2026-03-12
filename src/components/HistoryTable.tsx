'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnalysisStatus } from '@/types/analysis';

interface HistoryItem {
  id: string;
  imageName: string;
  status: string;
  confidence: number;
  plantType: string | null;
  pathology: string | null;
  description: string;
  createdAt: string;
}

interface HistoryTableProps {
  analyses: HistoryItem[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryTable({ analyses, page, totalPages, onPageChange }: HistoryTableProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Planta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Confiança</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyses.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.imageName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.plantType ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status as AnalysisStatus} size="sm" />
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {item.confidence}%
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {analyses.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.imageName}</p>
                <p className="text-xs text-muted-foreground">{item.plantType ?? '—'}</p>
              </div>
              <StatusBadge status={item.status as AnalysisStatus} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confiança: <span className="font-mono font-medium">{item.confidence}%</span></span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
