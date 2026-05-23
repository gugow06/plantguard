import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeImage } from '@/lib/gemini';
import { analyzeSchema } from '@/lib/validations/analyze';
import { rateLimit } from '@/lib/rate-limit';
import { sendDiseaseAlertEmail } from '@/lib/email';

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

    const geminiResult = await analyzeImage(image, mimeType);

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
      },
    });

    // Fire-and-forget after response is committed — never blocks or fails the main response
    if (geminiResult.status === 'Doente') {
      createDiseaseNotification(
        session.user.id,
        analysis.id,
        imageName,
        geminiResult,
        analysis.createdAt.toISOString(),
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
