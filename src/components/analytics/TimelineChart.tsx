'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimelineEntry } from '@/types/analytics';

interface TimelineChartProps {
  data: TimelineEntry[];
}

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '12m', days: 365 },
] as const;

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: { date: string } }> }) {
  if (!active || !payload?.length) return null;

  const isoDate = payload[0]?.payload?.date;
  const dateStr = isoDate
    ? format(parseISO(isoDate), "dd 'de' MMM, yyyy", { locale: ptBR })
    : '';

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      {dateStr && <p className="mb-2 text-sm font-semibold text-foreground">{dateStr}</p>}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [period, setPeriod] = useState<number>(30);

  const filteredData = useMemo(() => {
    const cutoff = period <= 90
      ? subDays(new Date(), period)
      : subMonths(new Date(), 12);

    return data.filter((d) => parseISO(d.date) >= cutoff);
  }, [data, period]);

  const formattedData = useMemo(
    () =>
      filteredData.map((d) => ({
        ...d,
        dateLabel: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
      })),
    [filteredData],
  );

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Tendência Temporal</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-display text-lg">Tendência Temporal</CardTitle>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.label}
              variant={period === p.days ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradSaudavel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDoente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c1121f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c1121f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInconclusivo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: 10 }}
              formatter={(value: string) => (
                <span className={cn('text-xs text-foreground')}>{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="saudavel"
              name="Saudável"
              stroke="#2d6a4f"
              fill="url(#gradSaudavel)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationBegin={0}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="doente"
              name="Doente"
              stroke="#c1121f"
              fill="url(#gradDoente)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationBegin={200}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="inconclusivo"
              name="Inconclusivo"
              stroke="#d4a017"
              fill="url(#gradInconclusivo)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationBegin={400}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
