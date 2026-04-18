'use client';

import { ImageIcon, HeartPulse, Bug, Target, Sprout } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/types/analytics';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof ImageIcon;
  color: string;
  bgColor: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, color, bgColor }: KpiCardProps) {
  return (
    <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className={cn('absolute inset-0 opacity-[0.03]', bgColor)} />
      <CardContent className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', bgColor)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiCardsProps {
  summary: AnalyticsSummary;
}

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        title="Total de Análises"
        value={summary.totalAnalyses.toLocaleString('pt-BR')}
        subtitle="imagens analisadas"
        icon={ImageIcon}
        color="text-primary"
        bgColor="bg-primary/10"
      />
      <KpiCard
        title="Taxa de Saúde"
        value={`${summary.healthRate}%`}
        subtitle="folhas saudáveis"
        icon={HeartPulse}
        color="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-500/10"
      />
      <KpiCard
        title="Patologias Detectadas"
        value={summary.distinctPathologies}
        subtitle="tipos distintos"
        icon={Bug}
        color="text-red-600 dark:text-red-400"
        bgColor="bg-red-500/10"
      />
      <KpiCard
        title="Confiança Média"
        value={`${summary.averageConfidence}%`}
        subtitle="nas análises"
        icon={Target}
        color="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-500/10"
      />
      <KpiCard
        title="Espécies Analisadas"
        value={summary.distinctPlantTypes}
        subtitle="plantas distintas"
        icon={Sprout}
        color="text-teal-600 dark:text-teal-400"
        bgColor="bg-teal-500/10"
      />
    </div>
  );
}
