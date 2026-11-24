import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAnalysisReportEmail, type ReportAnalysis } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { logProcessEvents } from '@/lib/process-log';
import { ACTIVITIES } from '@/lib/process-mining';

interface ImportedAnalysisInput {
  imageName?: unknown;
  status?: unknown;
  confidence?: unknown;
  plantType?: unknown;
  pathology?: unknown;
  description?: unknown;
  createdAt?: unknown;
}

function sanitizeImported(items: unknown): ReportAnalysis[] | null {
  if (!Array.isArray(items)) return null;
  return items.slice(0, 1000).map((item, idx) => {
    const r = (item ?? {}) as ImportedAnalysisInput;
    const rawConfidence = typeof r.confidence === 'number' ? r.confidence : Number(r.confidence) || 0;
    const createdAt = typeof r.createdAt === 'string' && r.createdAt
      ? r.createdAt
      : new Date().toISOString();
    return {
      id: `imported-${idx}`,
      imageName: typeof r.imageName === 'string' ? r.imageName : `linha-${idx + 1}`,
      status: typeof r.status === 'string' ? r.status : 'Inconclusivo',
      confidence: Math.round(Math.max(0, Math.min(100, rawConfidence))),
      plantType: typeof r.plantType === 'string' ? r.plantType : null,
      pathology: typeof r.pathology === 'string' ? r.pathology : null,
      description: typeof r.description === 'string' ? r.description : '',
      createdAt,
    };
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success } = rateLimit(`report:${session.user.id}`, { limit: 3, windowMs: 60 * 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Limite atingido. Aguarde 1 hora para enviar outro relatório.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const imported = sanitizeImported(body.analyses);
    const sourceLabel = typeof body.sourceLabel === 'string' ? body.sourceLabel.slice(0, 120) : null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Email do usuário não encontrado.' }, { status: 400 });
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let analyses: ReportAnalysis[];
    let reportCases: { caseId: string | null }[] = [];
    let period: { from: string; to: string };

    if (imported && imported.length > 0) {
      analyses = imported;
      const dates = imported
        .map((a) => new Date(a.createdAt).getTime())
        .filter((t) => !Number.isNaN(t));
      const from = dates.length ? new Date(Math.min(...dates)) : new Date();
      const to = dates.length ? new Date(Math.max(...dates)) : new Date();
      const fromLabel = sourceLabel ? `${sourceLabel} · ${fmt(from)}` : fmt(from);
      period = { from: fromLabel, to: fmt(to) };
    } else {
      const days = typeof body.days === 'number' && body.days > 0 && body.days <= 365
        ? body.days
        : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const records = await prisma.analysis.findMany({
        where: { userId: session.user.id, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageName: true,
          status: true,
          confidence: true,
          plantType: true,
          pathology: true,
          description: true,
          createdAt: true,
          caseId: true,
        },
      });
      reportCases = records;
      analyses = records.map((a) => ({
        id: a.id,
        imageName: a.imageName,
        status: a.status,
        plantType: a.plantType,
        pathology: a.pathology,
        description: a.description,
        confidence: Math.round(a.confidence),
        createdAt: a.createdAt.toISOString(),
      }));
      period = { from: fmt(since), to: fmt(new Date()) };
    }

    await sendAnalysisReportEmail(user.email, user.name ?? 'Usuário', analyses, period);

    const sentAt = new Date();
    await logProcessEvents(
      prisma,
      reportCases
        .filter((r): r is { caseId: string } => !!r.caseId)
        .map((r) => ({ caseId: r.caseId, activity: ACTIVITIES.RELATORIO, timestamp: sentAt, resource: 'e-mail', channel: 'upload' as const })),
    );

    return NextResponse.json({
      ok: true,
      count: analyses.length,
      sentTo: user.email,
    });
  } catch (error) {
    console.error('[POST /api/reports/email]', error);
    return NextResponse.json({ error: 'Erro ao enviar relatório.' }, { status: 500 });
  }
}
