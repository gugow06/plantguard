'use client';

import { ImageIcon, HeartPulse, Bug, Target, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/types/analytics';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof ImageIcon;
  accentClass: string;
  delay?: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, accentClass, delay }: KpiCardProps) {
  return (
    <div
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up"
      style={delay ? { animationDelay: delay } : undefined}
    >
      {/* Subtle background accent */}
      <div className={cn('absolute right-0 top-0 h-16 w-16 rounded-bl-3xl opacity-[0.07]', accentClass)} aria-hidden="true" />

      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accentClass + '/15')}>
        <Icon className={cn('h-5 w-5', accentClass.replace('bg-', 'text-'))} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface KpiCardsProps {
  summary: AnalyticsSummary;
}

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" role="list" aria-label="Métricas principais">
      <KpiCard
        title="Total de Análises"
        value={summary.totalAnalyses.toLocaleString('pt-BR')}
        subtitle="imagens analisadas"
        icon={ImageIcon}
        accentClass="bg-primary"
        delay="0ms"
      />
      <KpiCard
        title="Taxa de Saúde"
        value={`${summary.healthRate}%`}
        subtitle="folhas saudáveis"
        icon={HeartPulse}
        accentClass="bg-emerald-500"
        delay="50ms"
      />
      <KpiCard
        title="Patologias"
        value={summary.distinctPathologies}
        subtitle="tipos distintos"
        icon={Bug}
        accentClass="bg-red-500"
        delay="100ms"
      />
      <KpiCard
        title="Confiança Média"
        value={`${summary.averageConfidence}%`}
        subtitle="nas análises"
        icon={Target}
        accentClass="bg-amber-500"
        delay="150ms"
      />
      <KpiCard
        title="Espécies"
        value={summary.distinctPlantTypes}
        subtitle="plantas distintas"
        icon={Sprout}
        accentClass="bg-teal-500"
        delay="200ms"
      />
    </div>
  );
}
