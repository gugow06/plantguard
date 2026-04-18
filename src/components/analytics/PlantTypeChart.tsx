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
import type { PlantTypeFrequency } from '@/types/analytics';

interface PlantTypeChartProps {
  data: PlantTypeFrequency[];
}

const PLANT_COLORS = [
  '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2',
  '#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d',
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PlantTypeFrequency }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{item.plantType}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.count} {item.count === 1 ? 'análise' : 'análises'}
      </p>
    </div>
  );
}

export function PlantTypeChart({ data }: PlantTypeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Espécies Mais Analisadas</CardTitle>
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
        <CardTitle className="font-display text-lg">Espécies Mais Analisadas</CardTitle>
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
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={PLANT_COLORS[index % PLANT_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
