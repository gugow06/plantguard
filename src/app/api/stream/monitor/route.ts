import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getKafkaMetrics } from '@/lib/kafka';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STREAM_USER_EMAIL = process.env.STREAM_USER_EMAIL ?? 'agrosmart-stream@demo.local';

/**
 * Snapshot do fluxo do pipeline para a página /monitor:
 * - métricas do Kafka (offsets, total de mensagens, lag do consumer)
 * - análises gravadas pelo consumer (feed + distribuições + throughput)
 * - alertas recentes
 * Tudo restrito ao usuário do stream (o consumer grava nele).
 */
export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: STREAM_USER_EMAIL },
      select: { id: true },
    });

    const kafka = await getKafkaMetrics();

    if (!user) {
      return NextResponse.json({
        kafka,
        streamUser: STREAM_USER_EMAIL,
        ready: false,
        total: 0,
        statusCounts: { Saudável: 0, Doente: 0, Inconclusivo: 0 },
        throughput: { lastMin: 0, last5Min: 0 },
        plantDistribution: [],
        pathologyDistribution: [],
        feed: [],
        alerts: [],
      });
    }

    const [total, recent, alerts] = await Promise.all([
      prisma.analysis.count({ where: { userId: user.id } }),
      prisma.analysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: {
          id: true,
          imageName: true,
          status: true,
          plantType: true,
          pathology: true,
          confidence: true,
          createdAt: true,
        },
      }),
      prisma.notification.findMany({
        where: { userId: user.id, type: 'disease_alert' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { id: true, title: true, message: true, createdAt: true },
      }),
    ]);

    const now = Date.now();
    const statusCounts = { Saudável: 0, Doente: 0, Inconclusivo: 0 } as Record<string, number>;
    const plantMap = new Map<string, number>();
    const pathMap = new Map<string, number>();
    let lastMin = 0;
    let last5Min = 0;

    for (const a of recent) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
      if (a.plantType && a.plantType !== 'Não identificado') {
        plantMap.set(a.plantType, (plantMap.get(a.plantType) ?? 0) + 1);
      }
      if (a.pathology) {
        pathMap.set(a.pathology, (pathMap.get(a.pathology) ?? 0) + 1);
      }
      const age = now - a.createdAt.getTime();
      if (age <= 60_000) lastMin++;
      if (age <= 300_000) last5Min++;
    }

    const plantDistribution = Array.from(plantMap.entries())
      .map(([plantType, count]) => ({ plantType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const pathologyDistribution = Array.from(pathMap.entries())
      .map(([pathology, count]) => ({ pathology, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      kafka,
      streamUser: STREAM_USER_EMAIL,
      ready: true,
      total,
      statusCounts,
      throughput: { lastMin, last5Min },
      plantDistribution,
      pathologyDistribution,
      feed: recent.slice(0, 25),
      alerts,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao montar o monitor.' }, { status: 500 });
  }
}
