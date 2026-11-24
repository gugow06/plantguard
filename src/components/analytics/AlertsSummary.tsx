'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import { PlantAlertModal } from '@/components/PlantAlertModal';
import type { AlertRecord } from '@/lib/decision-rules';

interface AlertsSummaryProps {
  importedAlerts?: AlertRecord[];
}

async function requestAlerts(): Promise<AlertRecord[] | null> {
  try {
    const res = await fetch('/api/alerts?days=30', { cache: 'no-store' });
    if (!res.ok) return null;
    return ((await res.json()) as { alerts: AlertRecord[] }).alerts;
  } catch {
    return null;
  }
}

export function AlertsSummary({ importedAlerts }: AlertsSummaryProps) {
  const [liveAlerts, setLiveAlerts] = useState<AlertRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  // Carrega e atualiza em tempo real (a cada 5s), sem recarregar a página
  useEffect(() => {
    if (importedAlerts) return;
    let active = true;
    const load = () =>
      requestAlerts().then((alerts) => { if (active && alerts) setLiveAlerts(alerts); });
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [importedAlerts]);

  const alerts = importedAlerts ?? liveAlerts;
  const triggered = alerts.filter((a) => a.alert.triggered);

  if (triggered.length === 0) return null;

  const criticalCount = triggered.filter((a) => a.alert.severity === 'critical').length;
  const warningCount = triggered.filter((a) => a.alert.severity === 'warning').length;
  const hasCritical = criticalCount > 0;

  const headerBg = hasCritical ? 'bg-red-50 dark:bg-red-950/25' : 'bg-amber-50 dark:bg-amber-950/25';
  const borderColor = hasCritical ? 'border-red-200 dark:border-red-800/60' : 'border-amber-200 dark:border-amber-800/60';
  const iconBg = hasCritical ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40';
  const titleColor = hasCritical ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200';
  const subtitleColor = hasCritical ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400';
  const chevronColor = hasCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <>
      <div
        className={`overflow-hidden rounded-2xl border-2 shadow-sm animate-fade-in-up ${borderColor}`}
        role="region"
        aria-label={`${triggered.length} plantas em alerta`}
      >
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-controls="alerts-panel"
          className={`flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${headerBg}`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
              {hasCritical ? (
                <ShieldAlert className="h-4.5 w-4.5 text-red-700 dark:text-red-400" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${titleColor}`}>
                {triggered.length} {triggered.length === 1 ? 'planta em alerta' : 'plantas em alerta'}
              </p>
              <p className={`text-xs ${subtitleColor}`}>
                {criticalCount > 0 && `${criticalCount} crítica${criticalCount > 1 ? 's' : ''}`}
                {criticalCount > 0 && warningCount > 0 && ' · '}
                {warningCount > 0 && `${warningCount} em atenção`}
                {' — '}clique para {isExpanded ? 'recolher' : 'expandir'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className={`h-4 w-4 shrink-0 ${chevronColor}`} aria-hidden="true" />
          ) : (
            <ChevronDown className={`h-4 w-4 shrink-0 ${chevronColor}`} aria-hidden="true" />
          )}
        </button>

        {isExpanded && (
          <div id="alerts-panel" className="bg-card p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {triggered.map((record) => {
                const isCritical = record.alert.severity === 'critical';
                const cardBorder = isCritical
                  ? 'border-red-200 dark:border-red-800/60'
                  : 'border-amber-200 dark:border-amber-800/60';
                const badgeBg = isCritical
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

                return (
                  <button
                    key={record.plantType}
                    type="button"
                    onClick={() => setSelectedAlert(record)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all hover:bg-accent/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cardBorder}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Leaf className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <p className="truncate text-sm font-semibold text-foreground">{record.plantType}</p>
                      </div>
                      {record.topPathology && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[140px]">
                          {record.topPathology}
                        </p>
                      )}
                    </div>

                    <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                        {isCritical ? (
                          <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        )}
                        {Math.round(record.alert.diseaseRate * 100)}% doente
                      </span>
                      <p className="text-xs text-muted-foreground">{record.totalAnalyses} análises</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PlantAlertModal record={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </>
  );
}
