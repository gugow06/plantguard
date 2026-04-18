import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics | PlantGuard AI',
  description: 'Visualize métricas e tendências das suas análises de plantas.',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">
          Métricas e tendências das suas análises, {session.user.name ?? session.user.email}.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
