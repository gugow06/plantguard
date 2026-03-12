import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HistoryContent } from '@/components/HistoryContent';

export const metadata: Metadata = {
  title: 'Histórico | PlantGuard AI',
  description: 'Veja todas as análises de plantas realizadas anteriormente.',
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Histórico
        </h1>
        <p className="mt-1 text-muted-foreground">
          Veja todas as análises realizadas anteriormente.
        </p>
      </div>

      <HistoryContent />
    </div>
  );
}
