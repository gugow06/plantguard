import type { PrismaClient } from '../generated/prisma/client';

/**
 * Gravação do event log (tabela ProcessEvent). Usado pelo app (rotas da API) e
 * pelo consumer do Kafka. Nunca derruba o fluxo principal: em erro, só registra
 * no log da aplicação.
 *
 * Sem alias "@/" para poder ser importado pelos scripts de infra.
 */

export interface NewProcessEvent {
  caseId: string;
  activity: string;
  timestamp?: Date;
  resource: string;
  channel: 'camera' | 'upload';
  attributes?: Record<string, unknown>;
}

type ProcessEventClient = Pick<PrismaClient, 'processEvent'>;

export async function logProcessEvents(
  client: ProcessEventClient,
  events: NewProcessEvent[],
): Promise<void> {
  if (events.length === 0) return;
  try {
    await client.processEvent.createMany({
      data: events.map((e) => ({
        caseId: e.caseId,
        activity: e.activity,
        timestamp: e.timestamp ?? new Date(),
        resource: e.resource,
        channel: e.channel,
        source: 'real',
        attributes: e.attributes ? JSON.stringify(e.attributes) : null,
      })),
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'process-log',
        event: 'process_event_write_failed',
        caseId: events[0].caseId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}
