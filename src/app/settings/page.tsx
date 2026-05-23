import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AccountSettings } from '@/components/settings/AccountSettings';

export const metadata: Metadata = {
  title: 'Configurações | PlantGuard AI',
  description: 'Gerencie suas informações pessoais, senha e foto de perfil.',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie suas informações pessoais, senha e foto de perfil.
        </p>
      </div>

      <AccountSettings />
    </div>
  );
}
