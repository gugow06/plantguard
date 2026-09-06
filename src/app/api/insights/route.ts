import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { computeAnalytics } from '@/lib/compute-analytics';
import { computeAlerts } from '@/lib/compute-alerts';
import { generateFieldInsights, AiOverloadedError } from '@/lib/gemini-insights';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';

export const dynamic = 'force-dynamic';

const VALID_STATUS = ['Saudável', 'Doente', 'Inconclusivo'];

/** Normaliza registros vindos do cliente (dados importados) antes de agregar. */
function sanitizeImported(input: unknown): RawAnalysisRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((r) => {
      const item = (r ?? {}) as Record<string, unknown>;
      const status = String(item.status ?? '');
      return {
        imageName: String(item.imageName ?? ''),
        status: VALID_STATUS.includes(status) ? status : 'Inconclusivo',
        plantType: item.plantType != null ? String(item.plantType) : null,
        pathology: item.pathology != null ? String(item.pathology) : null,
        confidence: Math.max(0, Math.min(100, Number(item.confidence) || 0)),
        recommendations: item.recommendations != null ? String(item.recommendations) : undefined,
        createdAt: item.createdAt != null ? String(item.createdAt) : undefined,
      } satisfies RawAnalysisRecord;
    })
    .filter((r) => r.status);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Geração de IA é custosa — limita a 5 relatórios por hora por usuário
    const rl = rateLimit(`insights:${session.user.id}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitos relatórios gerados. Tente novamente mais tarde.' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const days = Math.min(365, Math.max(1, Number(body?.days) || 30));
    const imported = sanitizeImported(body?.analyses);

    let records: RawAnalysisRecord[];
    let sourceLabel: string;

    if (imported.length > 0) {
      records = imported;
      sourceLabel = body?.sourceLabel ? String(body.sourceLabel) : 'dados importados';
    } else {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const analyses = await prisma.analysis.findMany({
        where: { userId: session.user.id, createdAt: { gte: since } },
        select: {
          imageName: true,
          status: true,
          plantType: true,
          pathology: true,
          confidence: true,
          recommendations: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      records = analyses.map((a) => ({
        imageName: a.imageName,
        status: a.status,
        plantType: a.plantType,
        pathology: a.pathology,
        confidence: a.confidence,
        recommendations: a.recommendations ?? undefined,
        createdAt: a.createdAt.toISOString(),
      }));
      sourceLabel = 'dados do produtor';
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Sem análises suficientes para gerar um relatório.' },
        { status: 400 },
      );
    }

    const analytics = computeAnalytics(records);
    const alerts = computeAlerts(records);

    const report = await generateFieldInsights({ analytics, alerts, windowDays: days, sourceLabel });

    return NextResponse.json({
      report,
      meta: {
        totalAnalyses: analytics.summary.totalAnalyses,
        windowDays: days,
        sourceLabel,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AiOverloadedError) {
      return NextResponse.json(
        { error: 'IA temporariamente sobrecarregada. Tente novamente em alguns instantes.' },
        { status: 503 },
      );
    }
    const message = error instanceof Error ? error.message : '';
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'IA não configurada. Verifique a chave do Gemini.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Erro ao gerar o relatório de IA.' }, { status: 500 });
  }
}
