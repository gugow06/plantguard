import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { AnalysisStatus } from '@/types/analysis';

const statusConfig: Record<AnalysisStatus, {
  label: string;
  className: string;
  dotColor: string;
  icon: typeof CheckCircle2;
}> = {
  Saudável: {
    label: 'Saudável',
    className: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  Doente: {
    label: 'Doente',
    className: 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
    dotColor: 'bg-red-500',
    icon: XCircle,
  },
  Inconclusivo: {
    label: 'Inconclusivo',
    className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
    icon: AlertTriangle,
  },
};

interface StatusBadgeProps {
  status: AnalysisStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.Inconclusivo;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      <span className={cn('shrink-0 rounded-full', config.dotColor, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} aria-hidden="true" />
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {config.label}
    </span>
  );
}
