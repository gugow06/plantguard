/**
 * Avaliação de saúde da plataforma, usada por /api/health e pela página /monitor.
 *
 * Regras:
 * - Banco fora            -> "down"     (HTTP 503: o app não funciona sem o Postgres)
 * - Kafka fora            -> "degraded" (upload e dashboard seguem; o streaming para)
 * - Lag acima do limite   -> "degraded" (consumer não acompanha o producer)
 * - Tudo certo            -> "ok"
 */

export type ServiceState = 'up' | 'down';
export type OverallStatus = 'ok' | 'degraded' | 'down';

export const LAG_THRESHOLD = Number(process.env.HEALTH_LAG_THRESHOLD ?? 50);

export interface HealthInput {
  database: { up: boolean; latencyMs: number | null };
  kafka: { up: boolean; latencyMs: number | null; lag: number | null; totalMessages: number | null };
  lastConsumedAt: Date | null;
  now?: Date;
}

export interface HealthReport {
  status: OverallStatus;
  checkedAt: string;
  uptimeSeconds: number;
  version: string;
  services: {
    database: { status: ServiceState; latencyMs: number | null };
    kafka: { status: ServiceState; latencyMs: number | null };
    consumer: {
      status: 'ok' | 'lagging' | 'unknown';
      lag: number | null;
      lagThreshold: number;
      totalMessages: number | null;
      lastConsumedAt: string | null;
      lastConsumedAgeSeconds: number | null;
    };
  };
  issues: string[];
}

export function evaluateHealth(input: HealthInput): HealthReport {
  const now = input.now ?? new Date();
  const issues: string[] = [];

  if (!input.database.up) issues.push('Banco de dados (Postgres) indisponível.');
  if (!input.kafka.up) issues.push('Broker Kafka indisponível: o streaming está parado.');

  let consumerStatus: HealthReport['services']['consumer']['status'] = 'unknown';
  if (input.kafka.up && input.kafka.lag !== null) {
    consumerStatus = input.kafka.lag > LAG_THRESHOLD ? 'lagging' : 'ok';
    if (consumerStatus === 'lagging') {
      issues.push(`Consumer atrasado: ${input.kafka.lag} mensagens pendentes (limite ${LAG_THRESHOLD}).`);
    }
  }

  let status: OverallStatus = 'ok';
  if (!input.database.up) status = 'down';
  else if (!input.kafka.up || consumerStatus === 'lagging') status = 'degraded';

  return {
    status,
    checkedAt: now.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.APP_VERSION ?? 'dev',
    services: {
      database: { status: input.database.up ? 'up' : 'down', latencyMs: input.database.latencyMs },
      kafka: { status: input.kafka.up ? 'up' : 'down', latencyMs: input.kafka.latencyMs },
      consumer: {
        status: consumerStatus,
        lag: input.kafka.lag,
        lagThreshold: LAG_THRESHOLD,
        totalMessages: input.kafka.totalMessages,
        lastConsumedAt: input.lastConsumedAt?.toISOString() ?? null,
        lastConsumedAgeSeconds: input.lastConsumedAt
          ? Math.max(0, Math.round((now.getTime() - input.lastConsumedAt.getTime()) / 1000))
          : null,
      },
    },
    issues,
  };
}

/** HTTP status de /api/health: 503 só quando o app não consegue atender (banco fora). */
export function httpStatusFor(report: HealthReport): number {
  return report.status === 'down' ? 503 : 200;
}
