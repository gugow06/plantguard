import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/DashboardContent';

export const metadata: Metadata = {
  title: 'Dashboard | PlantGuard AI',
  description: 'Analise a saúde das suas plantas com inteligência artificial.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bem-vindo, {session.user.name ?? session.user.email}!
        </p>
      </div>

      <DashboardContent />
    </div>
  );
}
