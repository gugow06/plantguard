import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar | PlantGuard AI',
  description: 'Faça login ou crie sua conta no PlantGuard AI.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
