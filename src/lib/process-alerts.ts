import { prisma } from '@/lib/prisma';
import { logProcessEvents } from '@/lib/process-log';
import { ACTIVITIES } from '@/lib/process-mining';

/**
 * Registra "Alerta visualizado" no event log para as notificações que o produtor
 * acabou de abrir. O caso vem da análise ligada à notificação.
 */
export async function markAlertsSeen(notifications: { analysisId: string | null }[]) {
  const analysisIds = notifications.map((n) => n.analysisId).filter((id): id is string => !!id);
  if (analysisIds.length === 0) return;
  const analyses = await prisma.analysis.findMany({
    where: { id: { in: analysisIds }, caseId: { not: null } },
    select: { caseId: true, rawResponse: true },
  });
  const seenAt = new Date();
  await logProcessEvents(
    prisma,
    analyses.map((a) => ({
      caseId: a.caseId!,
      activity: ACTIVITIES.VISUALIZADO,
      timestamp: seenAt,
      resource: 'produtor',
      // Análises do stream guardam a mensagem do Kafka (com capturedAt) no rawResponse.
      channel: a.rawResponse?.includes('"capturedAt"') ? ('camera' as const) : ('upload' as const),
    })),
  );
}
