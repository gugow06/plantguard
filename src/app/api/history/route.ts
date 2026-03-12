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
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10));
    const status = searchParams.get('status');

    const where = {
      userId: session.user.id,
      ...(status && ['Saudável', 'Doente', 'Inconclusivo'].includes(status)
        ? { status }
        : {}),
    };

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          imageName: true,
          status: true,
          confidence: true,
          description: true,
          recommendations: true,
          plantType: true,
          pathology: true,
          createdAt: true,
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar histórico.' },
      { status: 500 },
    );
  }
}
