import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getKafkaMetrics } from '@/lib/kafka';
import { evaluateHealth, httpStatusFor } from '@/lib/health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STREAM_USER_EMAIL = process.env.STREAM_USER_EMAIL ?? 'agrosmart-stream@demo.local';

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; ms: number | null }> {
  const start = performance.now();
  try {
    const value = await fn();
    return { value, ms: Math.round(performance.now() - start) };
  } catch {
    return { value: null, ms: null };
  }
}

/**
 * GET /api/health — saúde do app, do Postgres, do Kafka e do consumer.
 * Público (sem dados de usuário), usado pelo healthcheck do Docker, pelo smoke
 * test do pipeline e pela página /monitor.
 */
export async function GET() {
  const db = await timed(() => prisma.$queryRaw`SELECT 1`);
  const kafka = await timed(() => getKafkaMetrics());

  let lastConsumedAt: Date | null = null;
  if (db.value !== null) {
    const last = await prisma.analysis
      .findFirst({
        where: { user: { email: STREAM_USER_EMAIL } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      .catch(() => null);
    lastConsumedAt = last?.createdAt ?? null;
  }

  const report = evaluateHealth({
    database: { up: db.value !== null, latencyMs: db.ms },
    kafka: {
      up: kafka.value !== null,
      latencyMs: kafka.value ? kafka.ms : null,
      lag: kafka.value?.lag ?? null,
      totalMessages: kafka.value?.totalMessages ?? null,
    },
    lastConsumedAt,
  });

  return NextResponse.json(report, {
    status: httpStatusFor(report),
    headers: { 'Cache-Control': 'no-store' },
  });
}
