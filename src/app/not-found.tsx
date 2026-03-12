import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Leaf className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground">404</h1>
      <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao início
      </Link>
    </main>
  );
}
