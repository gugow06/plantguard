import { prisma } from '@/lib/prisma';
import type { ProcessEventRow } from '@/lib/process-mining';

export type ProcessSource = 'all' | 'real' | 'simulado';

export function parseSource(value: string | null): ProcessSource {
  return value === 'real' || value === 'simulado' ? value : 'all';
}

/** Lê o event log (ProcessEvent) com filtro de origem. Limite de segurança: 50 mil eventos. */
export async function loadEventLog(source: ProcessSource): Promise<ProcessEventRow[]> {
  return prisma.processEvent.findMany({
    where: source === 'all' ? {} : { source },
    orderBy: [{ caseId: 'asc' }, { timestamp: 'asc' }],
    take: 50_000,
    select: {
      caseId: true,
      activity: true,
      timestamp: true,
      resource: true,
      channel: true,
      source: true,
    },
  });
}
