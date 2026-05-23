'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@/lib/validations/auth';

/* ─── Brand Panel decorative leaf SVG ─────────────────────────── */
function LeafPattern() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="leaves" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path
            d="M40 10 C55 10 70 25 70 40 C70 55 55 70 40 70 C25 70 10 55 10 40 C10 25 25 10 40 10Z"
            fill="none" stroke="white" strokeWidth="1"
          />
          <path d="M40 10 Q60 40 40 70 Q20 40 40 10Z" fill="none" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#leaves)" />
    </svg>
  );
}

/* ─── Field Component ──────────────────────────────────────────── */
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}
function Field({ id, label, error, children }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Password Input ───────────────────────────────────────────── */
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  errorId?: string;
}
function PasswordInput({ id, errorId, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        aria-describedby={errorId}
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
  );
}

/* ─── Google Button ────────────────────────────────────────────── */
function GoogleButton({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.89-1.741 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
        <path d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.122H3.073v2.59A9.996 9.996 0 0012 22z" fill="#34A853"/>
        <path d="M6.405 13.9A6.012 6.012 0 016.09 12c0-.659.113-1.3.314-1.9V7.51H3.073A9.996 9.996 0 002 12c0 1.614.386 3.14 1.073 4.49l3.332-2.59z" fill="#FBBC05"/>
        <path d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.99 14.695 2 12 2 8.09 2 4.71 4.245 3.073 7.51l3.332 2.59C7.19 7.737 9.395 5.977 12 5.977z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  );
}

/* ─── Tab Button ───────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1
        ${active
          ? 'bg-white dark:bg-card text-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
        }`}
    >
      {children}
    </button>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const uid = useId();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onLogin(data: LoginInput) {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', { email: data.email, password: data.password, redirect: false });
      if (result?.error) { toast.error('Email ou senha incorretos.'); return; }
      toast.success('Login realizado!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(data: RegisterInput) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error ?? 'Erro ao criar conta.'); return; }
      toast.success('Conta criada! Entrando...');
      await signIn('credentials', { email: data.email, password: data.password, redirect: false });
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogle() {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      toast.error('Erro ao conectar com o Google.');
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Skip to main content — WCAG 2.4.1 */}
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Ir para o formulário
      </a>

      <main className="grid min-h-screen lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">
        {/* ── Brand Panel (desktop) ── */}
        <div
          aria-hidden="true"
          className="relative hidden overflow-hidden bg-[#1b4332] lg:flex lg:flex-col lg:justify-between lg:p-12"
        >
          <LeafPattern />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#52b788]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C7 2 3 6.5 3 12c0 2.8 1.1 5.3 2.9 7.1L12 22l6.1-2.9C19.9 17.3 21 14.8 21 12c0-5.5-4-10-9-10z" fill="#fff" opacity=".9"/>
                <path d="M12 6v10M9 9c0 0 1 3 3 3s3-3 3-3" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">PlantGuard AI</span>
          </div>

          {/* Hero text */}
          <div className="relative z-10 space-y-6">
            <p className="font-display text-4xl font-bold leading-tight text-white xl:text-5xl">
              Diagnóstico<br />
              <span className="text-[#95d5b2]">inteligente</span><br />
              para suas plantas.
            </p>
            <p className="max-w-sm text-base leading-relaxed text-[#b7e4c7]">
              Analise a saúde das suas plantas com IA. Detecte doenças, receba recomendações e acompanhe o histórico da sua lavoura.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { value: '98%', label: 'precisão' },
              { value: '<3s', label: 'por análise' },
              { value: '50+', label: 'patologias' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-[#95d5b2]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C7 2 3 6.5 3 12c0 2.8 1.1 5.3 2.9 7.1L12 22l6.1-2.9C19.9 17.3 21 14.8 21 12c0-5.5-4-10-9-10z" fill="#fff" opacity=".9"/>
                <path d="M12 6v10M9 9c0 0 1 3 3 3s3-3 3-3" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">PlantGuard AI</h1>
            <p className="text-sm text-muted-foreground">Diagnóstico inteligente para suas plantas</p>
          </div>

          <div id="auth-form" className="w-full max-w-[380px] space-y-6" tabIndex={-1}>
            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="Modo de acesso"
              className="flex rounded-xl bg-muted p-1"
            >
              <TabBtn active={tab === 'login'} onClick={() => setTab('login')}>Entrar</TabBtn>
              <TabBtn active={tab === 'register'} onClick={() => setTab('register')}>Criar conta</TabBtn>
            </div>

            {/* Login form */}
            {tab === 'login' && (
              <div role="tabpanel" aria-label="Formulário de login">
                <div className="mb-5">
                  <h2 className="font-display text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Entre com suas credenciais para continuar.</p>
                </div>

                <GoogleButton disabled={isLoading} onClick={onGoogle} label="Entrar com Google" />

                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ou com email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate className="space-y-4">
                  <Field
                    id={`${uid}-login-email`}
                    label="Email"
                    error={loginForm.formState.errors.email?.message}
                  >
                    <Input
                      id={`${uid}-login-email`}
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      aria-describedby={loginForm.formState.errors.email ? `${uid}-login-email-error` : undefined}
                      aria-invalid={!!loginForm.formState.errors.email}
                      {...loginForm.register('email')}
                    />
                  </Field>

                  <Field
                    id={`${uid}-login-password`}
                    label="Senha"
                    error={loginForm.formState.errors.password?.message}
                  >
                    <PasswordInput
                      id={`${uid}-login-password`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      errorId={loginForm.formState.errors.password ? `${uid}-login-password-error` : undefined}
                      aria-invalid={!!loginForm.formState.errors.password}
                      {...loginForm.register('password')}
                    />
                  </Field>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 rounded"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Entrando...</>
                      : 'Entrar'}
                  </Button>
                </form>
              </div>
            )}

            {/* Register form */}
            {tab === 'register' && (
              <div role="tabpanel" aria-label="Formulário de cadastro">
                <div className="mb-5">
                  <h2 className="font-display text-xl font-semibold text-foreground">Criar conta</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Preencha os dados para começar a usar o PlantGuard.</p>
                </div>

                <GoogleButton disabled={isLoading} onClick={onGoogle} label="Criar conta com Google" />

                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ou com email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate className="space-y-4">
                  <Field
                    id={`${uid}-reg-name`}
                    label="Nome"
                    error={registerForm.formState.errors.name?.message}
                  >
                    <Input
                      id={`${uid}-reg-name`}
                      type="text"
                      placeholder="Seu nome"
                      autoComplete="name"
                      aria-invalid={!!registerForm.formState.errors.name}
                      {...registerForm.register('name')}
                    />
                  </Field>

                  <Field
                    id={`${uid}-reg-email`}
                    label="Email"
                    error={registerForm.formState.errors.email?.message}
                  >
                    <Input
                      id={`${uid}-reg-email`}
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      aria-invalid={!!registerForm.formState.errors.email}
                      {...registerForm.register('email')}
                    />
                  </Field>

                  <Field
                    id={`${uid}-reg-password`}
                    label="Senha"
                    error={registerForm.formState.errors.password?.message}
                  >
                    <PasswordInput
                      id={`${uid}-reg-password`}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      aria-invalid={!!registerForm.formState.errors.password}
                      {...registerForm.register('password')}
                    />
                  </Field>

                  <Field
                    id={`${uid}-reg-confirm`}
                    label="Confirmar senha"
                    error={registerForm.formState.errors.confirmPassword?.message}
                  >
                    <PasswordInput
                      id={`${uid}-reg-confirm`}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      aria-invalid={!!registerForm.formState.errors.confirmPassword}
                      {...registerForm.register('confirmPassword')}
                    />
                  </Field>

                  <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Criando conta...</>
                      : 'Criar conta'}
                  </Button>
                </form>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com os nossos{' '}
              <span className="font-medium text-foreground">Termos de Uso</span>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
