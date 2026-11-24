'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Clock, Download, GitBranch, Layers, Lightbulb, RefreshCw, Repeat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessMap } from '@/components/process/ProcessMap';
import { formatDuration, type ProcessSummary } from '@/lib/process-mining';
import { cn } from '@/lib/utils';

type Source = 'all' | 'real' | 'simulado';
type Summary = ProcessSummary & { source: Source };

const SOURCES: { value: Source; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'real', label: 'Execução real' },
  { value: 'simulado', label: 'Cenário simulado' },
];

const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;

async function requestSummary(source: Source): Promise<Summary> {
  const res = await fetch(`/api/process/summary?source=${source}`, { cache: 'no-store' });
  if (!res.ok) throw new Error();
  return (await res.json()) as Summary;
}

function Kpi({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: 'danger' | 'warning' }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <div
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-lg',
            tone === 'danger' && 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
            tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            !tone && 'bg-primary/10 text-primary',
          )}
        >
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

function buildInsights(s: Summary): { title: string; text: string; action: string }[] {
  const out: { title: string; text: string; action: string }[] = [];
  if (s.bottleneck) {
    out.push({
      title: 'Gargalo',
      text: `A maior espera do ciclo está entre "${s.bottleneck.from}" e "${s.bottleneck.to}": mediana de ${formatDuration(s.bottleneck.medianMs)} e P90 de ${formatDuration(s.bottleneck.p90Ms)}. A parte técnica (Kafka → banco) leva milissegundos.`,
      action: 'Alerta crítico por push/WhatsApp com lembrete automático se não for visto em 1 hora.',
    });
  }
  if (s.alerts.generated > 0) {
    out.push({
      title: 'Alertas sem resposta',
      text: `${pct(s.alerts.neverSeenShare)} dos ${s.alerts.generated} alertas nunca foram vistos, e ${pct(s.alerts.seenOutsideWorkHoursShare)} dos vistos foram gerados fora do expediente.`,
      action: 'Escalar para um segundo contato (técnico da cooperativa) quando o alerta não é visto.',
    });
  }
  if (s.rework.cases > 0) {
    out.push({
      title: 'Retrabalho',
      text: `${pct(s.rework.share)} dos casos repetem uma etapa, principalmente o laço "Diagnóstico inconclusivo → nova captura".`,
      action: 'Guia de captura (luz, distância, foco) antes do envio e quando a confiança fica abaixo de 70% (regra R4).',
    });
  }
  if (s.aiFailures.cases > 0) {
    out.push({
      title: 'Dependência externa',
      text: `${pct(s.aiFailures.share)} dos casos tiveram falha no diagnóstico por IA, e parte dos produtores desiste sem nova tentativa.`,
      action: 'Fila com nova tentativa automática (backoff) em vez de devolver o erro ao produtor.',
    });
  }
  return out;
}

export function ProcessContent() {
  const [source, setSource] = useState<Source>('all');
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<'frequency' | 'time'>('time');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      requestSummary(source)
        .then((d) => { if (active) { setData(d); setError(false); } })
        .catch(() => { if (active) setError(true); });
    load();
    const id = setInterval(load, 15_000); // eventos reais chegam em tempo real
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [source, reloadKey]);

  const changeSource = (s: Source) => {
    setData(null);
    setSource(s);
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg border border-border bg-card p-1" role="tablist" aria-label="Origem dos eventos">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            role="tab"
            aria-selected={source === s.value}
            onClick={() => changeSource(s.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              source === s.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
          <RefreshCw className="size-4" /> Atualizar
        </Button>
        <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/process/event-log?format=csv&source=${source}`} />}>
          <Download className="size-4" /> Event log (CSV)
        </Button>
        <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/process/event-log?format=xes&source=${source}`} />}>
          <Download className="size-4" /> XES
        </Button>
      </div>
    </div>
  );

  if (error && !data) {
    return (
      <div className="space-y-6">
        {toolbar}
        <Card><CardContent className="py-10 text-center text-muted-foreground">Não foi possível carregar o processo.</CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {toolbar}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (data.totals.cases === 0) {
    return (
      <div className="space-y-6">
        {toolbar}
        <Card>
          <CardContent className="space-y-2 py-10 text-center text-muted-foreground">
            <p>Ainda não há eventos {source === 'simulado' ? 'simulados' : source === 'real' ? 'reais' : ''} no event log.</p>
            <p className="text-sm">
              Os eventos reais nascem com o stream do Kafka e com os uploads. Para o cenário simulado, rode{' '}
              <code className="rounded bg-muted px-1.5 py-0.5">npm run process:simulate</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const waits = data.topWaits.map((e) => ({
    name: `${e.from} → ${e.to}`,
    mediana: +(e.medianMs / 3_600_000).toFixed(2),
    p90: +(e.p90Ms / 3_600_000).toFixed(2),
  }));
  const insights = buildInsights(data);

  return (
    <div className="space-y-6">
      {toolbar}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={<Layers className="size-5" />} label="Casos" value={String(data.totals.cases)} hint={`${data.totals.events} eventos · ${Object.entries(data.byChannel).map(([c, n]) => `${n} ${c === 'camera' ? 'câmera' : 'upload'}`).join(' · ')}`} />
        <Kpi icon={<GitBranch className="size-5" />} label="Variantes" value={String(data.totals.variants)} hint={`caminho principal: ${pct(data.happyPath.share)} dos casos`} />
        <Kpi icon={<Clock className="size-5" />} label="Lead time (mediana)" value={formatDuration(data.leadTime.medianMs)} hint={`P90 ${formatDuration(data.leadTime.p90Ms)}`} />
        <Kpi icon={<AlertTriangle className="size-5" />} label="Alertas nunca vistos" value={pct(data.alerts.neverSeenShare)} hint={`${data.alerts.neverSeen} de ${data.alerts.generated} alertas`} tone="danger" />
        <Kpi icon={<Repeat className="size-5" />} label="Retrabalho" value={pct(data.rework.share)} hint={`${data.rework.cases} casos repetem etapas`} tone="warning" />
      </section>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Mapa do processo (DFG)</CardTitle>
            <CardDescription>
              Descoberto a partir do event log. Espessura = frequência · {mode === 'time' ? 'rótulo e cor = tempo mediano de espera' : 'rótulo = número de casos'}
              {data.bottleneck && ' · em vermelho, o gargalo'}
            </CardDescription>
          </div>
          <div className="inline-flex rounded-lg border border-border p-1 text-sm">
            {(['time', 'frequency'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('rounded-md px-3 py-1', mode === m ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground')}
              >
                {m === 'time' ? 'Tempo' : 'Frequência'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[860px]">
            <ProcessMap dfg={data.dfg} mode={mode} bottleneck={data.bottleneck} />
          </div>
          {mode === 'time' && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {[['#6b8f71', '< 1 s (máquina)'], ['#2d7a52', '< 1 min'], ['#d4a017', '< 1 h'], ['#c1121f', '≥ 1 h (espera humana)']].map(([c, l]) => (
                <span key={l} className="inline-flex items-center gap-1.5"><span className="h-1.5 w-5 rounded" style={{ background: c }} />{l}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-primary" /> Análise e oportunidades de melhoria</CardTitle>
            <CardDescription>Gerada a partir das métricas do event log</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((i) => (
              <div key={i.title} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{i.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{i.text}</p>
                <p className="mt-2 text-sm text-foreground"><span className="font-medium text-primary">Melhoria: </span>{i.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maiores esperas entre atividades</CardTitle>
            <CardDescription>Mediana e P90, em horas (o relatório é um envio em lote, fora do ciclo de resposta)</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waits} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v} h`} />
                <Bar dataKey="mediana" name="Mediana" fill="#1b4d34" radius={[0, 4, 4, 0]} />
                <Bar dataKey="p90" name="P90" fill="#d4a017" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Variantes do processo</CardTitle>
          <CardDescription>Sequências de atividades mais frequentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.variants.slice(0, 8).map((v, idx) => (
            <div key={v.activities.join('>')} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center">
              <div className="flex w-40 shrink-0 items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">#{idx + 1}</span>
                <span className="text-sm tabular-nums text-foreground">{pct(v.share)}</span>
                <span className="text-xs text-muted-foreground">({v.count})</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-1">
                {v.activities.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">{a}</span>
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">lead time médio {formatDuration(v.meanLeadTimeMs)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
