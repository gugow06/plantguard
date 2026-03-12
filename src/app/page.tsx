import Link from 'next/link';
import { Leaf, Camera, BarChart3, Download, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlantGuard AI — Diagnóstico inteligente de plantas',
  description:
    'Envie uma foto da sua planta e receba um diagnóstico profissional da sua saúde, alimentado por inteligência artificial.',
};

const steps = [
  {
    number: '1',
    icon: Camera,
    title: 'Envie uma foto',
    description: 'Tire uma foto da planta ou alimento que deseja analisar.',
  },
  {
    number: '2',
    icon: BarChart3,
    title: 'Receba o diagnóstico',
    description: 'A IA analisa e retorna status, confiança e recomendações.',
  },
  {
    number: '3',
    icon: Download,
    title: 'Acompanhe e exporte',
    description: 'Consulte seu histórico e exporte dados em CSV ou JSON.',
  },
];

const linkBase =
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip link for keyboard users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header */}
      <header className="border-b border-border" role="banner">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="PlantGuard AI — Página inicial"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">PlantGuard</span>
          </Link>
          <nav aria-label="Ações da conta" className="flex items-center gap-2">
            <Link
              href="/login"
              className={`${linkBase} h-8 px-3 hover:bg-muted hover:text-foreground`}
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className={`${linkBase} h-8 bg-primary px-3 text-primary-foreground hover:bg-primary/90`}
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="px-4 py-20 sm:px-6 sm:py-28" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-2xl text-center">
            <h1
              id="hero-heading"
              className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Diagnóstico de plantas{' '}
              <span className="text-primary">com inteligência artificial</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Envie uma foto e receba um laudo profissional da saúde da sua planta — rápido,
              simples e confiável.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className={`${linkBase} h-9 gap-2 bg-primary px-4 text-primary-foreground hover:bg-primary/90`}
              >
                Começar agora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section
          className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6"
          aria-labelledby="steps-heading"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="steps-heading"
              className="text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Como funciona
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Três passos simples para diagnosticar sua planta.
            </p>

            <ol className="mt-12 grid gap-6 sm:grid-cols-3" role="list">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="relative rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                      aria-hidden="true"
                    >
                      {step.number}
                    </span>
                    <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 sm:px-6" role="contentinfo">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
            <span>PlantGuard AI</span>
          </div>
          <p>Diagnóstico assistido por IA — não substitui consultoria profissional.</p>
        </div>
      </footer>
    </div>
  );
}
