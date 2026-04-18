'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConfidenceDistribution } from '@/types/analytics';

interface ConfidenceHistogramProps {
  data: ConfidenceDistribution[];
}

const RANGE_COLORS = ['#c1121f', '#e04f3a', '#d4a017', '#40916c', '#2d6a4f'];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ConfidenceDistribution }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">Confiança {item.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.count} {item.count === 1 ? 'análise' : 'análises'}
      </p>
    </div>
  );
}

export function ConfidenceHistogram({ data }: ConfidenceHistogramProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Distribuição de Confiança</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-lg">Distribuição de Confiança</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={RANGE_COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
