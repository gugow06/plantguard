'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HistoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Histórico
        </h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">Algo deu errado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocorreu um erro ao carregar o histórico.
          </p>
          <Button onClick={reset} className="mt-6">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
