'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Leaf,
  TrendingDown,
  Stethoscope,
} from 'lucide-react';
import type { AnalysisStatus } from '@/types/analysis';

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

type RowAlert = { type: 'disease' } | { type: 'uncertain' } | { type: 'inconclusive' } | null;

function getRowAlert(status: string, confidence: number): RowAlert {
  if (status === 'Doente') return { type: 'disease' };
  if (status === 'Inconclusivo') return { type: 'inconclusive' };
  if (status === 'Saudável' && confidence <= 70) return { type: 'uncertain' };
  return null;
}

function AlertBadge({ alert, onClick }: { alert: RowAlert; onClick?: () => void }) {
  if (!alert) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">OK</span>
      </span>
    );
  }

  if (alert.type === 'disease') {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Doente
      </button>
    );
  }

  if (alert.type === 'inconclusive') {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Inconclusivo
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      Incerto
    </button>
  );
}

function buildPrognosis(status: string, confidence: number, pathology: string | null): string {
  if (status === 'Doente') {
    if (pathology) {
      return `Sem tratamento adequado, "${pathology}" tende a progredir e pode afetar outras plantas da mesma espécie nas proximidades.`;
    }
    return `A doença detectada pode se espalhar sem intervenção. Monitore diariamente e aplique tratamento preventivo nas plantas vizinhas.`;
  }
  if (status === 'Inconclusivo') {
    return `Sem uma nova análise conclusiva, não é possível determinar se a planta necessita de tratamento. O atraso no diagnóstico pode agravar eventuais problemas não detectados.`;
  }
  return `Diagnóstico incerto (${confidence}% de confiança). Recomenda-se nova análise com imagem mais nítida para confirmar o estado de saúde.`;
}

function AlertDetailModal({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const isDisease = item.status === 'Doente';
  const isInconclusive = item.status === 'Inconclusivo';
  const borderCls = isDisease
    ? 'border-red-200 dark:border-red-800'
    : 'border-amber-200 dark:border-amber-800';
  const headerCls = isDisease
    ? 'bg-red-50 dark:bg-red-950/30'
    : 'bg-amber-50 dark:bg-amber-950/30';
  const iconCls = isDisease
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-600 dark:text-amber-400';
  const badgeCls = isDisease
    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

  const label = isDisease ? 'Doença Detectada' : isInconclusive ? 'Resultado Inconclusivo' : 'Diagnóstico Incerto';
  const prognosis = buildPrognosis(item.status, item.confidence, item.pathology);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className={`relative mx-4 w-full max-w-md overflow-hidden border ${borderCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${borderCls} ${headerCls} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20">
              <AlertTriangle className={`h-5 w-5 ${iconCls}`} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{item.plantType ?? item.imageName}</h2>
              <span className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}>
                {label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Confiança */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">Confiança do diagnóstico</span>
            <span className={`text-sm font-bold ${item.confidence <= 70 ? 'text-amber-600' : 'text-foreground'}`}>
              {item.confidence}%
            </span>
          </div>

          {/* Motivo inconclusivo */}
          {isInconclusive && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="mb-1 text-xs font-medium text-amber-800 dark:text-amber-300">Por que inconclusivo?</p>
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {item.confidence < 50
                  ? `A confiança do modelo foi de apenas ${item.confidence}%, abaixo do mínimo necessário para um diagnóstico definitivo. Isso pode indicar imagem de baixa qualidade, iluminação inadequada ou ângulo desfavorável.`
                  : `A imagem apresentou características ambíguas (${item.confidence}% de confiança). Os sintomas visíveis não correspondem de forma clara a nenhuma patologia conhecida ou estado saudável confirmado.`}
              </p>
            </div>
          )}

          {/* Patologia */}
          {item.pathology && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Stethoscope className={`mt-0.5 h-4 w-4 flex-shrink-0 ${iconCls}`} />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Patologia identificada</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{item.pathology}</p>
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Leaf className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Diagnóstico</p>
              <p className="mt-0.5 text-sm text-foreground">{item.description}</p>
            </div>
          </div>

          {/* Recomendação */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Recomendação</p>
            <p className="text-sm text-foreground">{item.recommendations}</p>
          </div>

          {/* Previsão */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Previsão</p>
              <p className="mt-0.5 text-sm text-foreground">{prognosis}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function HistoryTable({ analyses, page, totalPages, onPageChange }: HistoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  return (
    <>
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
                <TableHead>Alerta</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((item) => {
                const alert = getRowAlert(item.status, item.confidence);
                return (
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
                    <TableCell>
                      <AlertBadge
                        alert={alert}
                        onClick={alert ? () => setSelectedItem(item) : undefined}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {analyses.map((item) => {
            const alert = getRowAlert(item.status, item.confidence);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.imageName}</p>
                    <p className="text-xs text-muted-foreground">{item.plantType ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertBadge
                      alert={alert}
                      onClick={alert ? () => setSelectedItem(item) : undefined}
                    />
                    <StatusBadge status={item.status as AnalysisStatus} size="sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confiança: <span className="font-mono font-medium">{item.confidence}%</span></span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
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

      {selectedItem && (
        <AlertDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
