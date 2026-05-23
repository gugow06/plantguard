'use client';

import { useState } from 'react';
import { ChevronDown, Stethoscope, Lightbulb, Eye, Leaf } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { AnalysisStatus } from '@/types/analysis';

interface AnalysisCardProps {
  status: AnalysisStatus;
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  visualEvidence?: string[];
}

const confidenceLabel = (v: number) => {
  if (v >= 85) return { text: 'Alta confiança', color: 'text-emerald-700 dark:text-emerald-400' };
  if (v >= 65) return { text: 'Confiança moderada', color: 'text-amber-700 dark:text-amber-400' };
  return { text: 'Baixa confiança', color: 'text-red-700 dark:text-red-400' };
};

const confidenceBarColor = (v: number) => {
  if (v >= 85) return '[&>div]:bg-emerald-500';
  if (v >= 65) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
};

export function AnalysisCard({
  status,
  plantType,
  pathology,
  confidence,
  description,
  recommendations,
  visualEvidence,
}: AnalysisCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    recommendations: false,
    evidence: false,
  });

  const toggle = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const { text: confText, color: confColor } = confidenceLabel(confidence);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-fade-in-up">
      {/* Header band */}
      <div
        className={cn(
          'px-5 py-4 border-b border-border',
          status === 'Doente'
            ? 'bg-red-50/60 dark:bg-red-950/20'
            : status === 'Inconclusivo'
              ? 'bg-amber-50/60 dark:bg-amber-950/20'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <StatusBadge status={status} />
            {plantType && (
              <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-foreground font-display">
                <Leaf className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                {plantType}
              </p>
            )}
            {pathology && (
              <p className="text-sm font-medium text-destructive">{pathology}</p>
            )}
          </div>
        </div>

        {/* Confidence meter */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Confiança da análise</span>
            <span className={cn('font-mono text-sm font-bold tabular-nums', confColor)}>
              {confidence}%
            </span>
          </div>
          <Progress
            value={confidence}
            className={cn('h-2 bg-muted', confidenceBarColor(confidence))}
          />
          <p className={cn('text-xs', confColor)}>{confText}</p>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="divide-y divide-border">
        <CollapsibleSection
          icon={Stethoscope}
          title="Diagnóstico"
          isOpen={expandedSections.description}
          onToggle={() => toggle('description')}
          sectionId="section-diagnosis"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </CollapsibleSection>

        <CollapsibleSection
          icon={Lightbulb}
          title="Recomendações"
          isOpen={expandedSections.recommendations}
          onToggle={() => toggle('recommendations')}
          sectionId="section-recommendations"
        >
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {recommendations}
          </p>
        </CollapsibleSection>

        {visualEvidence && visualEvidence.length > 0 && (
          <CollapsibleSection
            icon={Eye}
            title={`Evidências Visuais (${visualEvidence.length})`}
            isOpen={expandedSections.evidence}
            onToggle={() => toggle('evidence')}
            sectionId="section-evidence"
          >
            <ul className="space-y-1.5" role="list">
              {visualEvidence.map((evidence, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {evidence}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
  sectionId,
}: {
  icon: typeof Stethoscope;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  sectionId: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={sectionId}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div id={sectionId} className="px-5 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
