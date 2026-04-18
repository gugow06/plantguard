'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusDistribution } from '@/types/analytics';

const STATUS_COLORS: Record<string, string> = {
  Saudável: '#2d6a4f',
  Doente: '#c1121f',
  Inconclusivo: '#d4a017',
};

const STATUS_COLORS_DARK: Record<string, string> = {
  Saudável: '#52b788',
  Doente: '#ef4444',
  Inconclusivo: '#f59e0b',
};

interface StatusPieChartProps {
  data: StatusDistribution[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{item.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.value} {item.value === 1 ? 'análise' : 'análises'} ({(item.payload.percent * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-display text-lg">Distribuição de Status</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    name: d.status,
    percent: d.count / total,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-lg">Distribuição de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="count"
              nameKey="name"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={
                    typeof window !== 'undefined' &&
                    document.documentElement.classList.contains('dark')
                      ? (STATUS_COLORS_DARK[entry.status] ?? '#6b7280')
                      : (STATUS_COLORS[entry.status] ?? '#6b7280')
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
