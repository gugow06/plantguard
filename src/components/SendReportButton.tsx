'use client';

import { useState } from 'react';
import { Mail, ChevronDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
];

interface SendReportButtonProps {
  importedAnalyses?: RawAnalysisRecord[];
  importedFileName?: string;
}

export function SendReportButton({ importedAnalyses, importedFileName }: SendReportButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isImportMode = !!importedAnalyses && importedAnalyses.length > 0;

  const send = async (payload: Record<string, unknown>) => {
    setOpen(false);
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao enviar relatório.');
        return;
      }
      setSent(true);
      toast.success(`Relatório enviado! ${data.count} análise(s) para ${data.sentTo}`);
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (isImportMode) {
      send({
        analyses: importedAnalyses,
        sourceLabel: importedFileName ?? 'Dados importados',
      });
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        aria-haspopup={isImportMode ? undefined : 'true'}
        aria-expanded={isImportMode ? undefined : open}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : sent ? (
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        ) : (
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {loading ? 'Enviando...' : sent ? 'Enviado!' : 'Enviar relatório'}
        {!isImportMode && !loading && !sent && (
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        )}
      </Button>

      {!isImportMode && open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-md animate-fade-in"
        >
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Período do relatório
          </p>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              role="menuitem"
              onClick={() => send({ days: opt.days })}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {!isImportMode && open && (
        <div
          className="fixed inset-0 z-10"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
