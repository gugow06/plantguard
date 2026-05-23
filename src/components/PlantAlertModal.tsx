'use client';

import { X, AlertTriangle, ShieldAlert, Leaf, TrendingDown, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AlertRecord } from '@/lib/decision-rules';

interface PlantAlertModalProps {
  record: AlertRecord | null;
  onClose: () => void;
}

const COLORS = {
  Saudável: '#22c55e',
  Doente: '#ef4444',
  Inconclusivo: '#f59e0b',
};

const SEVERITY_CONFIG = {
  warning: {
    icon: AlertTriangle,
    label: 'Alerta de Infestação',
    badgeCls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    iconCls: 'text-amber-600 dark:text-amber-400',
    borderCls: 'border-amber-200 dark:border-amber-800',
    headerCls: 'bg-amber-50 dark:bg-amber-950/30',
  },
  critical: {
    icon: ShieldAlert,
    label: 'Intervenção Urgente',
    badgeCls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    iconCls: 'text-red-600 dark:text-red-400',
    borderCls: 'border-red-200 dark:border-red-800',
    headerCls: 'bg-red-50 dark:bg-red-950/30',
  },
  safe: {
    icon: Leaf,
    label: 'Planta Saudável',
    badgeCls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    iconCls: 'text-green-600 dark:text-green-400',
    borderCls: 'border-green-200 dark:border-green-800',
    headerCls: 'bg-green-50 dark:bg-green-950/30',
  },
};

export function PlantAlertModal({ record, onClose }: PlantAlertModalProps) {
  if (!record) return null;

  const { alert, plantType, topPathology, totalAnalyses } = record;
  const cfg = SEVERITY_CONFIG[alert.severity];
  const SeverityIcon = cfg.icon;

  const healthyPct = Math.round((record.alert.diseaseRate === 0
    ? (totalAnalyses > 0 ? 1 : 0)
    : (totalAnalyses - Math.round(alert.diseaseRate * totalAnalyses)) / totalAnalyses) * 100);

  const pieData = [
    { name: 'Saudável', value: Math.round((1 - alert.diseaseRate) * totalAnalyses) },
    { name: 'Doente', value: Math.round(alert.diseaseRate * totalAnalyses) },
  ].filter((d) => d.value > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className={`relative mx-4 w-full max-w-lg overflow-hidden border ${cfg.borderCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${cfg.borderCls} ${cfg.headerCls} p-5`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20`}>
              <SeverityIcon className={`h-5 w-5 ${cfg.iconCls}`} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{plantType}</h2>
              <span className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeCls}`}>
                {cfg.label}
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
        <div className="space-y-5 p-5">
          {/* Health summary */}
          <div className="flex items-center gap-5">
            <div className="h-28 w-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name as keyof typeof COLORS] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} análises`, '']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Taxa de saúde</p>
                <p className="text-2xl font-bold text-foreground">{healthyPct}%</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Taxa de doença</p>
                <p className={`text-xl font-bold ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                  {Math.round(alert.diseaseRate * 100)}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{totalAnalyses} análises nos últimos 30 dias</p>
            </div>
          </div>

          {/* Pathology */}
          {topPathology && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Patologia mais frequente</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{topPathology}</p>
              <p className="text-xs text-muted-foreground">detectada em {record.topPathologyCount} análise(s)</p>
            </div>
          )}

          {/* Triggered rules */}
          {alert.rules.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Por que está em alerta?</p>
              </div>
              <ul className="space-y-1.5">
                {alert.rules.map((rule) => (
                  <li key={rule.id} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="mt-0.5 text-xs font-bold text-muted-foreground">{rule.id}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Recomendação</p>
            <p className="text-sm text-foreground">{alert.recommendation}</p>
          </div>

          {/* Prognosis */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Previsão</p>
              <p className="mt-0.5 text-sm text-foreground">{alert.prognosis}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
