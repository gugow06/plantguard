'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

type FormData = z.infer<typeof schema>;

function PasswordInput({ id, label, error, ...props }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState(
    token ? '' : 'Link inválido. Solicite um novo link de redefinição.',
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!token) return;
    setServerError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) { setServerError(result.error ?? 'Erro ao redefinir senha.'); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setServerError('Erro de conexão. Tente novamente.');
    }
  }

  /* Invalid token */
  if (!token) {
    return (
      <div className="space-y-5 rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-xl font-semibold text-foreground">Link inválido</h1>
          <p className="text-sm text-muted-foreground">Este link de redefinição é inválido ou expirou.</p>
        </div>
        <Link href="/forgot-password">
          <Button className="w-full">Solicitar novo link</Button>
        </Link>
      </div>
    );
  }

  /* Success */
  if (done) {
    return (
      <div className="space-y-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-xl font-semibold text-foreground">Senha redefinida!</h1>
          <p className="text-sm text-muted-foreground">
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">Ir para o login</Button>
        </Link>
      </div>
    );
  }

  /* Form */
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C7 2 3 6.5 3 12c0 2.8 1.1 5.3 2.9 7.1L12 22l6.1-2.9C19.9 17.3 21 14.8 21 12c0-5.5-4-10-9-10z" fill="#fff" opacity=".9"/>
            <path d="M12 6v10M9 9c0 0 1 3 3 3s3-3 3-3" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-foreground">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Crie uma senha segura com pelo menos 6 caracteres.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput
          id="rp-password"
          label="Nova senha"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          id="rp-confirm"
          label="Confirmar nova senha"
          placeholder="Repita a senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando...</>
            : 'Salvar nova senha'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao login
        </Link>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
