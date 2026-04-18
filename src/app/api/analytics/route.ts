import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const plantType = searchParams.get('plantType');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    if (plantType) {
      where.plantType = plantType;
    }

    // Fetch all analyses matching filters (select only needed fields)
    const analyses = await prisma.analysis.findMany({
      where,
      select: {
        status: true,
        confidence: true,
        plantType: true,
        pathology: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const total = analyses.length;

    // Summary KPIs
    const healthyCount = analyses.filter((a) => a.status === 'Saudável').length;
    const healthRate = total > 0 ? Math.round((healthyCount / total) * 1000) / 10 : 0;
    const distinctPathologies = new Set(
      analyses.filter((a) => a.pathology).map((a) => a.pathology),
    ).size;
    const averageConfidence =
      total > 0
        ? Math.round((analyses.reduce((sum, a) => sum + a.confidence, 0) / total) * 10) / 10
        : 0;

    // Status distribution
    const statusMap = new Map<string, number>();
    for (const a of analyses) {
      statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
    }
    const statusDistribution = Array.from(statusMap.entries()).map(([s, count]) => ({
      status: s,
      count,
    }));

    // Pathology frequency (top 10)
    const pathMap = new Map<string, number>();
    for (const a of analyses) {
      if (a.pathology) {
        pathMap.set(a.pathology, (pathMap.get(a.pathology) ?? 0) + 1);
      }
    }
    const pathologyFrequency = Array.from(pathMap.entries())
      .map(([pathology, count]) => ({ pathology, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Timeline (grouped by day)
    const timelineMap = new Map<string, { saudavel: number; doente: number; inconclusivo: number }>();
    for (const a of analyses) {
      const day = a.createdAt.toISOString().split('T')[0];
      const entry = timelineMap.get(day) ?? { saudavel: 0, doente: 0, inconclusivo: 0 };
      if (a.status === 'Saudável') entry.saudavel++;
      else if (a.status === 'Doente') entry.doente++;
      else entry.inconclusivo++;
      timelineMap.set(day, entry);
    }
    const timeline = Array.from(timelineMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Plant type frequency (top 10)
    const plantMap = new Map<string, number>();
    for (const a of analyses) {
      if (a.plantType && a.plantType !== 'Não identificado') {
        plantMap.set(a.plantType, (plantMap.get(a.plantType) ?? 0) + 1);
      }
    }
    const plantTypeFrequency = Array.from(plantMap.entries())
      .map(([pt, count]) => ({ plantType: pt, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Confidence distribution
    const confidenceRanges = [
      { range: '0-29', label: '0-29%', min: 0, max: 29 },
      { range: '30-49', label: '30-49%', min: 30, max: 49 },
      { range: '50-69', label: '50-69%', min: 50, max: 69 },
      { range: '70-89', label: '70-89%', min: 70, max: 89 },
      { range: '90-100', label: '90-100%', min: 90, max: 100 },
    ];
    const confidenceDistribution = confidenceRanges.map(({ range, label, min, max }) => ({
      range,
      label,
      count: analyses.filter((a) => a.confidence >= min && a.confidence <= max).length,
    }));

    const distinctPlantTypes = new Set(
      analyses.filter((a) => a.plantType && a.plantType !== 'Não identificado').map((a) => a.plantType),
    ).size;

    // Plant health breakdown (status per plant type, top 10)
    const plantHealthMap = new Map<string, { saudavel: number; doente: number; inconclusivo: number }>();
    for (const a of analyses) {
      if (a.plantType && a.plantType !== 'Não identificado') {
        const entry = plantHealthMap.get(a.plantType) ?? { saudavel: 0, doente: 0, inconclusivo: 0 };
        if (a.status === 'Saudável') entry.saudavel++;
        else if (a.status === 'Doente') entry.doente++;
        else entry.inconclusivo++;
        plantHealthMap.set(a.plantType, entry);
      }
    }
    const plantHealthBreakdown = Array.from(plantHealthMap.entries())
      .map(([plantType, counts]) => ({ plantType, ...counts }))
      .sort((a, b) => (b.saudavel + b.doente + b.inconclusivo) - (a.saudavel + a.doente + a.inconclusivo))
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalAnalyses: total,
        healthRate,
        distinctPathologies,
        averageConfidence,
        distinctPlantTypes,
      },
      statusDistribution,
      pathologyFrequency,
      timeline,
      plantTypeFrequency,
      confidenceDistribution,
      plantHealthBreakdown,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar analytics.' },
      { status: 500 },
    );
  }
}
