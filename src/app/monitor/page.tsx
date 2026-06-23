'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowLeft, Database, Leaf, Radio, TriangleAlert } from 'lucide-react';

interface FeedItem {
  id: string;
  imageName: string;
  status: string;
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  createdAt: string;
}
interface AlertItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}
interface KafkaMetrics {
  topic: string;
  partitions: number;
  totalMessages: number;
  consumerGroup: string;
  lag: number;
}
interface MonitorData {
  kafka: KafkaMetrics | null;
  streamUser: string;
  ready: boolean;
  total: number;
  statusCounts: Record<string, number>;
  throughput: { lastMin: number; last5Min: number };
  plantDistribution: { plantType: string; count: number }[];
  pathologyDistribution: { pathology: string; count: number }[];
  feed: FeedItem[];
  alerts: AlertItem[];
}

const STATUS_COLOR: Record<string, string> = {
  Saudável: '#2d6a4f',
  Doente: '#c1121f',
  Inconclusivo: '#d4a017',
};

function statusStyle(status: string) {
  if (status === 'Doente') return 'bg-red-50 text-red-700 ring-red-600/20';
  if (status === 'Saudável') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  return 'bg-amber-50 text-amber-700 ring-amber-600/20';
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return 'agora';
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function Metric({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <div className={`grid size-10 place-items-center rounded-lg ${accent ?? 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const newestId = useRef<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/stream/monitor', { cache: 'no-store' });
        if (!res.ok) throw new Error('fail');
        const json: MonitorData = await res.json();
        if (!active) return;
        // destaca a nova análise no topo do feed
        const top = json.feed[0]?.id ?? null;
        if (top && newestId.current && top !== newestId.current) {
          setFlashId(top);
          setTimeout(() => active && setFlashId(null), 1500);
        }
        newestId.current = top;
        setData(json);
        setError(false);
        setLastUpdate(new Date());
      } catch {
        if (active) setError(true);
      }
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const statusData = data
    ? Object.entries(data.statusCounts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid size-9 place-items-center rounded-lg ring-1 ring-foreground/10 hover:bg-muted"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Radio className="size-5 text-primary" />
                Monitor do Pipeline — Kafka
              </h1>
              <p className="text-xs text-muted-foreground">
                Fluxo de análises distribuídas pelo tópico em tempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className={`size-2 rounded-full ${error ? 'bg-red-500' : 'animate-pulse bg-emerald-500'}`} />
              {error ? 'Sem conexão' : 'Ao vivo'}
            </span>
            {lastUpdate && (
              <span className="text-muted-foreground">
                atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5">
        {/* Métricas Kafka + throughput */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            icon={<Database className="size-5" />}
            label="Mensagens no tópico"
            value={data?.kafka?.totalMessages ?? '—'}
            hint={data?.kafka ? `${data.kafka.topic} · ${data.kafka.partitions} partição(ões)` : 'Kafka indisponível'}
          />
          <Metric
            icon={<Activity className="size-5" />}
            label="Lag do consumer"
            value={data?.kafka?.lag ?? '—'}
            hint={data?.kafka ? `grupo ${data.kafka.consumerGroup}` : '—'}
            accent={
              data?.kafka && data.kafka.lag > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }
          />
          <Metric
            icon={<Leaf className="size-5" />}
            label="Análises gravadas"
            value={data?.total ?? '—'}
            hint="persistidas no Postgres"
          />
          <Metric
            icon={<Radio className="size-5" />}
            label="Throughput"
            value={data ? `${data.throughput.lastMin}/min` : '—'}
            hint={data ? `${data.throughput.last5Min} nos últimos 5 min` : '—'}
            accent="bg-blue-100 text-blue-700"
          />
        </section>

        {/* Contadores por status */}
        <section className="grid grid-cols-3 gap-3">
          {(['Saudável', 'Doente', 'Inconclusivo'] as const).map((s) => (
            <Card key={s}>
              <CardContent className="py-1">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                  <span className="text-sm text-muted-foreground">{s}</span>
                </div>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {data?.statusCounts[s] ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Feed ao vivo */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Activity className="size-4 text-primary" />
                Feed ao vivo — últimas análises distribuídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1">
                {!data?.feed.length && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Aguardando mensagens do producer…
                  </p>
                )}
                {data?.feed.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors ${
                      flashId === f.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''
                    }`}
                  >
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle(f.status)}`}
                    >
                      {f.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.imageName}
                        {f.plantType && <span className="text-muted-foreground"> · {f.plantType}</span>}
                      </p>
                      {f.pathology && (
                        <p className="truncate text-xs text-red-600">{f.pathology}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {f.confidence}%
                    </span>
                    <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                      {timeAgo(f.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por status (donut) */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Distribuição por status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                      isAnimationActive={false}
                    >
                      {statusData.map((e) => (
                        <Cell key={e.name} fill={STATUS_COLOR[e.name] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Distribuição por planta */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Distribuição por planta</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.plantDistribution.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.plantDistribution} layout="vertical" margin={{ left: 12, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="plantType"
                      width={90}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="count" fill="#2d6a4f" radius={[0, 6, 6, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>
              )}
            </CardContent>
          </Card>

          {/* Alertas recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <TriangleAlert className="size-4 text-red-600" />
                Alertas gerados pelo consumer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                {!data?.alerts.length && (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum alerta ainda</p>
                )}
                {data?.alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-red-800">{a.title}</p>
                      <span className="shrink-0 text-xs text-red-600/70">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="truncate text-xs text-red-700">{a.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Fonte do fluxo: usuário <code className="rounded bg-muted px-1">{data?.streamUser}</code> ·
          tópico <code className="rounded bg-muted px-1">{data?.kafka?.topic ?? 'plant-classifications'}</code> ·
          atualização automática a cada 3s
        </p>
      </main>
    </div>
  );
}
