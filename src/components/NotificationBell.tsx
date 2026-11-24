'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCheck,
  Leaf,
  TrendingDown,
  Stethoscope,
  Lightbulb,
  CircleCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotifData {
  analysisId: string;
  imageName: string;
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: string | null;
  analysisId: string | null;
  createdAt: string;
}

// ─── Time formatting ─────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? 'ontem' : `${days} dias atrás`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function NotificationDetailModal({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  let data: NotifData | null = null;
  try {
    if (notification.data) data = JSON.parse(notification.data);
  } catch {
    // ignore
  }

  const isCritical = data && data.confidence >= 70;
  // O modal só é aberto por clique do usuário, portanto sempre no cliente.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-detail-title"
    >
      <div
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-lg animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between border-b border-border p-5',
          isCritical ? 'bg-red-50 dark:bg-red-950/20' : 'bg-amber-50 dark:bg-amber-950/20',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              isCritical ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40',
            )}>
              {isCritical
                ? <ShieldAlert className="h-4.5 w-4.5 text-red-700 dark:text-red-400" aria-hidden="true" />
                : <AlertTriangle className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              }
            </div>
            <div>
              <h2 id="notif-detail-title" className="font-display text-base font-semibold text-foreground">
                {notification.title}
              </h2>
              <p className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {data ? (
          <div className="space-y-4 p-5">
            {/* Plant + pathology */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Leaf className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                {data.plantType && (
                  <p className="font-semibold text-foreground">{data.plantType}</p>
                )}
                {data.pathology && (
                  <p className="text-sm font-medium text-destructive">{data.pathology}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Arquivo: {data.imageName} ·{' '}
                  {new Date(data.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Confiança da análise</span>
                <span className={cn(
                  'font-mono font-bold',
                  data.confidence >= 70 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400',
                )}>
                  {data.confidence}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    data.confidence >= 70 ? 'bg-red-500' : 'bg-amber-500',
                  )}
                  style={{ width: `${data.confidence}%` }}
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diagnóstico</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{data.description}</p>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/20">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Recomendações</p>
              </div>
              <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-300 whitespace-pre-line">
                {data.recommendations}
              </p>
            </div>

            {/* Prognosis */}
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-4">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previsão</p>
                <p className="mt-1 text-sm text-foreground">
                  {data.confidence >= 70
                    ? 'Sem intervenção imediata, a infestação tende a se agravar e se espalhar para plantas vizinhas.'
                    : 'Monitorar de perto nas próximas 48h. Risco de progressão moderado com tratamento preventivo.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotifItem({
  notif,
  onClick,
}: {
  notif: Notification;
  onClick: (n: Notification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(notif)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        !notif.read && 'bg-primary/5',
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', notif.read ? 'font-normal text-foreground' : 'font-semibold text-foreground')}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{notif.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notif.createdAt)}</p>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NotificationsPayload {
  notifications: Notification[];
  unreadCount: number;
}

async function requestNotifications(): Promise<NotificationsPayload | null> {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return null;
    return (await res.json()) as NotificationsPayload;
  } catch {
    return null;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState<Notification | null>(null);
  // true até a primeira carga terminar (spinner só quando a lista está vazia)
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const applyNotifications = useCallback((data: NotificationsPayload | null) => {
    if (data) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
    setLoading(false);
  }, []);

  const fetchNotifications = useCallback(
    () => requestNotifications().then(applyNotifications),
    [applyNotifications],
  );

  // Atualiza em tempo real (a cada 15s), sem recarregar a página
  useEffect(() => {
    let active = true;
    const load = () => requestNotifications().then((d) => { if (active) applyNotifications(d); });
    load();
    const interval = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [applyNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const handleSelectNotif = async (notif: Notification) => {
    setOpen(false);
    setSelected(notif);

    if (!notif.read) {
      await fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read: true } : n),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lidas` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Bell className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-lg animate-fade-in-up"
          style={{ maxHeight: '480px' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Notificações</h2>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Marcar todas como lidas"
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Marcar todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar notificações"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {loading && notifications.length === 0 ? (
              <div className="space-y-1 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted shimmer" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CircleCheck className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground">Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <NotifItem key={notif.id} notif={notif} onClick={handleSelectNotif} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
