import Link from 'next/link';
import { Leaf, Camera, BarChart3, Download, ArrowRight, Microscope, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlantGuard AI — Diagnóstico inteligente de plantas',
  description:
    'Envie uma foto da sua planta e receba um diagnóstico profissional da sua saúde, alimentado por inteligência artificial.',
};

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Envie uma foto',
    description: 'Fotografe a folha, caule ou fruto que deseja avaliar. JPEG, PNG ou WebP.',
  },
  {
    number: '02',
    icon: Microscope,
    title: 'Análise por IA',
    description: 'Gemini AI identifica patologia, confiança e evidências visuais em segundos.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Acompanhe e exporte',
    description: 'Consulte o histórico completo e exporte dados em CSV ou JSON.',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Alta precisão',
    description: 'Modelos treinados em datasets botânicos com 95%+ de acurácia em espécies comuns.',
  },
  {
    icon: Zap,
    title: 'Resultado em segundos',
    description: 'Da foto ao laudo completo em menos de 5 segundos, sem espera.',
  },
  {
    icon: BarChart3,
    title: 'Analytics detalhados',
    description: 'Dashboards com tendências, taxas de saúde e alertas automáticos por cultura.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md" role="banner">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="PlantGuard AI — Página inicial"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-foreground">PlantGuard</span>
          </Link>

          <nav aria-label="Ações da conta" className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-lg px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32"
          aria-labelledby="hero-heading"
        >
          {/* Subtle background grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
            aria-hidden="true"
          />

          {/* Glow blob */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            {/* Label pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              Powered by Gemini AI
            </div>

            <h1
              id="hero-heading"
              className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Diagnóstico de plantas{' '}
              <em className="not-italic text-primary">com inteligência</em>{' '}
              artificial
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Envie uma foto e receba um laudo completo da saúde da sua planta —
              patologia, confiança, recomendações e prognóstico.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Ver demonstração
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-xs text-muted-foreground">
              Gratuito · Sem cartão de crédito · Resultados em segundos
            </p>
          </div>
        </section>

        {/* Steps */}
        <section
          className="border-t border-border bg-card/60 px-4 py-20 sm:px-6"
          aria-labelledby="steps-heading"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2
                id="steps-heading"
                className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Como funciona
              </h2>
              <p className="mt-2 text-muted-foreground">
                Três etapas para diagnosticar qualquer cultura.
              </p>
            </div>

            <ol className="grid gap-6 sm:grid-cols-3" role="list">
              {steps.map((step, i) => (
                <li
                  key={step.number}
                  className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Step number */}
                  <span
                    className="font-display text-4xl font-bold text-border select-none"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>

                  <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section
          className="border-t border-border px-4 py-20 sm:px-6"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2
                id="features-heading"
                className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Por que PlantGuard?
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="border-t border-border bg-primary px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
              Pronto para diagnosticar sua lavoura?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Crie sua conta gratuitamente e faça a primeira análise agora.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary-foreground px-6 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 sm:px-6" role="contentinfo">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">PlantGuard AI</span>
          </div>
          <p>Diagnóstico assistido por IA — não substitui consultoria agronômica profissional.</p>
        </div>
      </footer>
    </div>
  );
}
