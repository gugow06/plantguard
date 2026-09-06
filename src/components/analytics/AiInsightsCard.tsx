'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ListChecks,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';
import type { FieldInsightsReport, RiskLevel, Urgency } from '@/lib/gemini-insights';

interface InsightsMeta {
  totalAnalyses: number;
  windowDays: number;
  sourceLabel: string;
  generatedAt: string;
}

interface AiInsightsCardProps {
  importedAnalyses?: RawAnalysisRecord[];
  importedFileName?: string;
  days?: number;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; icon: typeof ShieldCheck; badgeCls: string; iconCls: string }
> = {
  baixo: {
    label: 'Risco baixo',
    icon: ShieldCheck,
    badgeCls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    iconCls: 'text-green-600 dark:text-green-400',
  },
  moderado: {
    label: 'Risco moderado',
    icon: AlertTriangle,
    badgeCls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    iconCls: 'text-amber-600 dark:text-amber-400',
  },
  alto: {
    label: 'Risco alto',
    icon: AlertTriangle,
    badgeCls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    iconCls: 'text-orange-600 dark:text-orange-400',
  },
  critico: {
    label: 'Risco crítico',
    icon: ShieldAlert,
    badgeCls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    iconCls: 'text-red-600 dark:text-red-400',
  },
};

const URGENCY_CONFIG: Record<Urgency, { label: string; cls: string }> = {
  alta: { label: 'Alta', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  baixa: { label: 'Baixa', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
};

export function AiInsightsCard({ importedAnalyses, importedFileName, days = 30 }: AiInsightsCardProps = {}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FieldInsightsReport | null>(null);
  const [meta, setMeta] = useState<InsightsMeta | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isImportMode = !!importedAnalyses && importedAnalyses.length > 0;

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = isImportMode
        ? { analyses: importedAnalyses, sourceLabel: importedFileName ?? 'Dados importados' }
        : { days };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao gerar o relatório.');
        return;
      }
      setReport(data.report);
      setMeta(data.meta);
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [isImportMode, importedAnalyses, importedFileName, days]);

  const close = useCallback(() => {
    setReport(null);
    setMeta(null);
  }, []);

  useEffect(() => {
    if (!report) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [report, close]);

  const risk = report ? RISK_CONFIG[report.nivelRisco] : null;
  const RiskIcon = risk?.icon;

  const modal =
    report && risk && RiskIcon ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="Relatório de IA de apoio à decisão"
      >
        <Card
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Relatório de IA — Apoio à Decisão
                </h2>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${risk.badgeCls}`}
                >
                  <RiskIcon className={`h-3 w-3 ${risk.iconCls}`} aria-hidden="true" />
                  {risk.label}
                </span>
              </div>
            </div>
            <button
              onClick={close}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 p-5">
            {/* Resumo executivo */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Resumo executivo
              </p>
              <p className="text-sm leading-relaxed text-foreground">{report.resumoExecutivo}</p>
            </div>

            {/* Principais achados */}
            {report.principaisAchados.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Principais achados
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {report.principaisAchados.map((achado, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {achado}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prioridades */}
            {report.prioridades.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Prioridades de ação
                  </p>
                </div>
                <ul className="space-y-2">
                  {report.prioridades.map((p, i) => {
                    const u = URGENCY_CONFIG[p.urgencia];
                    return (
                      <li key={i} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{p.titulo}</p>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${u.cls}`}
                          >
                            {u.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{p.acao}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Recomendações */}
            {report.recomendacoes.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recomendações
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {report.recomendacoes.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Previsão */}
            {report.previsao && (
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Previsão
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">{report.previsao}</p>
                </div>
              </div>
            )}

            {/* Meta */}
            {meta && (
              <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
                Baseado em {meta.totalAnalyses} análise(s) — janela de {meta.windowDays} dias · fonte:{' '}
                {meta.sourceLabel} · gerado por Gemini em{' '}
                {new Date(meta.generatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </Card>
      </div>
    ) : null;

  return (
    <>
      <Button size="sm" onClick={generate} disabled={loading} className="gap-1.5">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {loading ? 'Gerando...' : 'Gerar Relatório com IA'}
      </Button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
