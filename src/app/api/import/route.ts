import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { importRowSchema } from '@/lib/validations/import';
import Papa from 'papaparse';

const MAX_ROWS = 500;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success } = rateLimit(`import:${session.user.id}`, {
      limit: 30,
      windowMs: 3600_000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de importações excedido. Tente novamente mais tarde.' },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Formato inválido. Use .csv ou .json.' },
        { status: 400 },
      );
    }

    const text = await file.text();
    let rawRows: Record<string, unknown>[];

    if (fileName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
      }
    } else {
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      rawRows = result.data as Record<string, unknown>[];
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio.' }, { status: 400 });
    }

    if (rawRows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Limite de ${MAX_ROWS} registros por importação excedido.` },
        { status: 400 },
      );
    }

    const errors: { row: number; message: string }[] = [];
    const validRows: {
      userId: string;
      imageName: string;
      imageData: string;
      status: string;
      confidence: number;
      description: string;
      recommendations: string;
      plantType: string | null;
      pathology: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const parsed = importRowSchema.safeParse(rawRows[i]);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join('; ');
        errors.push({ row: i + 1, message: msg });
        continue;
      }

      const row = parsed.data;
      const now = new Date();
      validRows.push({
        userId: session.user.id,
        imageName: row.imageName,
        imageData: '',
        status: row.status,
        confidence: row.confidence,
        description: row.description ?? 'Importado via CSV/JSON',
        recommendations: row.recommendations ?? '',
        plantType: row.plantType ?? null,
        pathology: row.pathology ?? null,
        createdAt: row.createdAt ?? now,
        updatedAt: now,
      });
    }

    let imported = 0;
    if (validRows.length > 0) {
      const result = await prisma.analysis.createMany({
        data: validRows,
      });
      imported = result.count;
    }

    return NextResponse.json({ imported, errors });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao importar dados.' },
      { status: 500 },
    );
  }
}
