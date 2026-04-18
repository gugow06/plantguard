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
import type { PathologyFrequency } from '@/types/analytics';

interface PathologyBarChartProps {
  data: PathologyFrequency[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PathologyFrequency }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{item.pathology}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.count} {item.count === 1 ? 'ocorrência' : 'ocorrências'}
      </p>
    </div>
  );
}

const GRADIENT_COLORS = [
  '#c1121f', '#d4342a', '#e04f3a', '#e8694e', '#f08262',
  '#f29b78', '#f5b490', '#f7caa8', '#f9dfc2', '#faf0dd',
];

export function PathologyBarChart({ data }: PathologyBarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Patologias Mais Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhuma patologia detectada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-lg">Patologias Mais Frequentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="pathology"
              width={140}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={GRADIENT_COLORS[Math.min(index, GRADIENT_COLORS.length - 1)]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
