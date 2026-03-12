'use client';

import { useState } from 'react';
import { ChevronDown, Stethoscope, Lightbulb, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

const confidenceColor = (value: number) => {
  if (value >= 70) return 'text-emerald-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-red-600';
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <StatusBadge status={status} />
            {plantType && (
              <p className="mt-2 text-lg font-semibold text-foreground">{plantType}</p>
            )}
            {pathology && <p className="text-sm text-destructive font-medium">{pathology}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Confiança</span>
            <span className={cn('font-mono font-semibold', confidenceColor(confidence))}>
              {confidence}%
            </span>
          </div>
          <Progress value={confidence} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Diagnóstico */}
        <CollapsibleSection
          icon={Stethoscope}
          title="Diagnóstico"
          isOpen={expandedSections.description}
          onToggle={() => toggle('description')}
        >
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </CollapsibleSection>

        {/* Recomendações */}
        <CollapsibleSection
          icon={Lightbulb}
          title="Recomendações"
          isOpen={expandedSections.recommendations}
          onToggle={() => toggle('recommendations')}
        >
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {recommendations}
          </p>
        </CollapsibleSection>

        {/* Evidências Visuais */}
        {visualEvidence && visualEvidence.length > 0 && (
          <CollapsibleSection
            icon={Eye}
            title="Evidências Visuais"
            isOpen={expandedSections.evidence}
            onToggle={() => toggle('evidence')}
          >
            <ul className="space-y-1">
              {visualEvidence.map((evidence, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {evidence}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>
  );
}

function CollapsibleSection({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
}: {
  icon: typeof Stethoscope;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
