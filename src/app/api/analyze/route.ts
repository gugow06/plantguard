import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeImage } from '@/lib/gemini';
import { analyzeSchema } from '@/lib/validations/analyze';
import { rateLimit } from '@/lib/rate-limit';
import { sendDiseaseAlertEmail } from '@/lib/email';
import { logProcessEvents, type NewProcessEvent } from '@/lib/process-log';
import { ACTIVITIES } from '@/lib/process-mining';

async function createDiseaseNotification(
  userId: string,
  analysisId: string,
  imageName: string,
  geminiResult: {
    plantType: string | null;
    pathology: string | null;
    confidence: number;
    description: string;
    recommendations: string;
  },
  createdAt: string,
  caseId: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const notifTitle = `Planta doente detectada${geminiResult.plantType ? `: ${geminiResult.plantType}` : ''}`;
    const notifMessage = geminiResult.pathology
      ? `${geminiResult.pathology} — ${geminiResult.confidence}% de confiança`
      : `Confiança: ${geminiResult.confidence}%`;

    const notifData = JSON.stringify({
      analysisId,
      imageName,
      plantType: geminiResult.plantType,
      pathology: geminiResult.pathology,
      confidence: geminiResult.confidence,
      description: geminiResult.description,
      recommendations: geminiResult.recommendations,
      createdAt,
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'disease_alert',
        title: notifTitle,
        message: notifMessage,
        data: notifData,
        analysisId,
      },
    });
    await logProcessEvents(prisma, [
      { caseId, activity: ACTIVITIES.ALERTA, resource: 'motor-de-regras', channel: 'upload', attributes: { pathology: geminiResult.pathology, confidence: geminiResult.confidence } },
    ]);

    if (user?.email) {
      await sendDiseaseAlertEmail(user.email, {
        userName: user.name ?? 'Usuário',
        analysisId,
        imageName,
        plantType: geminiResult.plantType,
        pathology: geminiResult.pathology,
        confidence: geminiResult.confidence,
        description: geminiResult.description,
        recommendations: geminiResult.recommendations,
        createdAt,
      });
    }
  } catch (e) {
    console.error('[disease-notification]', e);
  }
}

export async function POST(request: Request) {
  // Event log do canal de upload: a captura é o recebimento da imagem.
  const caseId = randomUUID();
  const receivedAt = new Date();
  const events: NewProcessEvent[] = [];
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success, remaining } = rateLimit(`analyze:${session.user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Tente novamente em 1 minuto.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
      );
    }

    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { image, mimeType, imageName } = parsed.data;
    events.push({ caseId, activity: ACTIVITIES.CAPTURA, timestamp: receivedAt, resource: 'produtor', channel: 'upload', attributes: { imageName } });

    const aiStart = Date.now();
    let geminiResult: Awaited<ReturnType<typeof analyzeImage>>;
    try {
      geminiResult = await analyzeImage(image, mimeType);
    } catch (aiError) {
      events.push({ caseId, activity: ACTIVITIES.FALHA_IA, resource: 'gemini', channel: 'upload', attributes: { durationMs: Date.now() - aiStart } });
      throw aiError;
    }
    events.push({ caseId, activity: ACTIVITIES.DIAGNOSTICO, resource: 'gemini', channel: 'upload', attributes: { durationMs: Date.now() - aiStart, status: geminiResult.status, confidence: geminiResult.confidence } });
    if (geminiResult.status === 'Inconclusivo') {
      events.push({ caseId, activity: ACTIVITIES.INCONCLUSIVO, resource: 'gemini', channel: 'upload', attributes: { confidence: geminiResult.confidence } });
    }

    const analysis = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        imageName,
        imageData: `data:${mimeType};base64,${image.slice(0, 200)}...`,
        status: geminiResult.status,
        confidence: geminiResult.confidence,
        description: geminiResult.description,
        recommendations: geminiResult.recommendations,
        plantType: geminiResult.plantType,
        pathology: geminiResult.pathology,
        rawResponse: JSON.stringify(geminiResult),
        caseId,
      },
    });
    events.push({ caseId, activity: ACTIVITIES.REGISTRADA, resource: 'postgres', channel: 'upload', attributes: { status: geminiResult.status } });
    await logProcessEvents(prisma, events);

    // Fire-and-forget after response is committed — never blocks or fails the main response
    if (geminiResult.status === 'Doente') {
      createDiseaseNotification(
        session.user.id,
        analysis.id,
        imageName,
        geminiResult,
        analysis.createdAt.toISOString(),
        caseId,
      );
    }

    return NextResponse.json({
      id: analysis.id,
      status: analysis.status,
      plantType: analysis.plantType,
      pathology: analysis.pathology,
      confidence: analysis.confidence,
      description: analysis.description,
      recommendations: analysis.recommendations,
      visualEvidence: geminiResult.visualEvidence ?? [],
      createdAt: analysis.createdAt.toISOString(),
    });
  } catch (error) {
    // Registra o caminho até a falha (ex.: captura -> falha no diagnóstico).
    await logProcessEvents(prisma, events);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[/api/analyze] Error:', message, error);

    if (message.includes('API_KEY') || message.includes('401') || message.includes('403')) {
      return NextResponse.json(
        { error: 'Erro de configuração da API. Verifique a chave do Gemini.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar análise. Tente novamente.' },
      { status: 500 },
    );
  }
}
