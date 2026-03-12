import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeImage } from '@/lib/gemini';
import { analyzeSchema } from '@/lib/validations/analyze';
import { rateLimit } from '@/lib/rate-limit';

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
