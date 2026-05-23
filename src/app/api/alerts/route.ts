import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluatePlantAlert } from '@/lib/decision-rules';
import type { AlertRecord } from '@/lib/decision-rules';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const analyses = await prisma.analysis.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: since },
        plantType: { not: null },
      },
      select: {
        plantType: true,
        status: true,
        pathology: true,
        confidence: true,
        recommendations: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by plantType
    const plantMap = new Map<
      string,
      {
        saudavel: number;
        doente: number;
        inconclusivo: number;
        lowConfidenceSaudavel: number;
        pathologyCounts: Map<string, number>;
        lastSeenAt: string;
        latestRecommendation: string;
      }
    >();

    for (const a of analyses) {
      if (!a.plantType || a.plantType === 'Não identificado') continue;

      const existing = plantMap.get(a.plantType) ?? {
        saudavel: 0,
        doente: 0,
        inconclusivo: 0,
        lowConfidenceSaudavel: 0,
        pathologyCounts: new Map<string, number>(),
        lastSeenAt: a.createdAt.toISOString(),
        latestRecommendation: '',
      };

      if (a.status === 'Saudável') {
        existing.saudavel++;
        if (a.confidence <= 70) existing.lowConfidenceSaudavel++;
      } else if (a.status === 'Doente') {
        existing.doente++;
      } else {
        existing.inconclusivo++;
      }

      if (a.pathology) {
        existing.pathologyCounts.set(
          a.pathology,
          (existing.pathologyCounts.get(a.pathology) ?? 0) + 1,
        );
      }

      if (!existing.latestRecommendation && a.recommendations) {
        existing.latestRecommendation = a.recommendations;
      }

      plantMap.set(a.plantType, existing);
    }

    const alertRecords: AlertRecord[] = [];

    for (const [plantType, data] of plantMap.entries()) {
      const breakdown = {
        plantType,
        saudavel: data.saudavel,
        doente: data.doente,
        inconclusivo: data.inconclusivo,
      };

      // Find top pathology
      let topPathology: string | null = null;
      let topPathologyCount = 0;
      for (const [path, count] of data.pathologyCounts.entries()) {
        if (count > topPathologyCount) {
          topPathology = path;
          topPathologyCount = count;
        }
      }

      const alert = evaluatePlantAlert(breakdown, topPathology, topPathologyCount, data.lowConfidenceSaudavel);

      alertRecords.push({
        plantType,
        alert,
        topPathology,
        topPathologyCount,
        lastSeenAt: data.lastSeenAt,
        totalAnalyses: data.saudavel + data.doente + data.inconclusivo,
      });
    }

    // Sort: critical first, then warning, then safe
    alertRecords.sort((a, b) => {
      const order = { critical: 0, warning: 1, safe: 2 };
      return order[a.alert.severity] - order[b.alert.severity];
    });

    return NextResponse.json({ alerts: alertRecords, windowDays: days });
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular alertas.' }, { status: 500 });
  }
}
