import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProcessContent } from '@/components/process/ProcessContent';

export const metadata: Metadata = {
  title: 'Processo | PlantGuard AI',
  description: 'Mineração de processos: como cada leitura de planta percorre a plataforma.',
};

export default async function ProcessPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Processo</h1>
        <p className="mt-1 text-muted-foreground">
          Mineração de processos: o caminho de cada leitura de planta, da captura ao alerta visto.
        </p>
      </div>
      <ProcessContent />
    </div>
  );
}
