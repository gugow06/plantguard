'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({ email: z.string().email('Digite um email válido.') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json();
      if (!res.ok) { setServerError(result.error ?? 'Erro ao processar. Tente novamente.'); return; }
      setSent(true);
    } catch {
      setServerError('Erro de conexão. Tente novamente.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao login
        </Link>

        {sent ? (
          /* Success state */
          <div className="space-y-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-xl font-semibold text-foreground">Email enviado!</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Se <strong className="text-foreground">{getValues('email')}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-xs text-muted-foreground">O link expira em 1 hora. Verifique também sua caixa de spam.</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          /* Form state */
          <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
            {/* Header */}
            <div className="space-y-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2C7 2 3 6.5 3 12c0 2.8 1.1 5.3 2.9 7.1L12 22l6.1-2.9C19.9 17.3 21 14.8 21 12c0-5.5-4-10-9-10z" fill="#fff" opacity=".9"/>
                  <path d="M12 6v10M9 9c0 0 1 3 3 3s3-3 3-3" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="font-display text-xl font-semibold text-foreground">Esqueceu sua senha?</h1>
              <p className="text-sm text-muted-foreground">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'fp-email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="fp-email-error" role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
                    <span aria-hidden="true">⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Enviando...</>
                  : 'Enviar link de redefinição'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
