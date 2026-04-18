'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlantHealthBreakdown } from '@/types/analytics';

interface PlantHealthChartProps {
  data: PlantHealthBreakdown[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
          <span className="text-muted-foreground">
            ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export function PlantHealthChart({ data }: PlantHealthChartProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Saúde por Espécie</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-lg">Saúde por Espécie</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
            <XAxis
              dataKey="plantType"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={70}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: 10 }}
              formatter={(value: string) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="saudavel"
              name="Saudável"
              stackId="health"
              fill="#2d6a4f"
              radius={[0, 0, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar
              dataKey="doente"
              name="Doente"
              stackId="health"
              fill="#c1121f"
              radius={[0, 0, 0, 0]}
              animationBegin={200}
              animationDuration={800}
            />
            <Bar
              dataKey="inconclusivo"
              name="Inconclusivo"
              stackId="health"
              fill="#d4a017"
              radius={[4, 4, 0, 0]}
              animationBegin={400}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
