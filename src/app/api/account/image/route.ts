import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateImageSchema } from '@/lib/validations/profile';
import { rateLimit } from '@/lib/rate-limit';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success } = rateLimit(`avatar:${session.user.id}`, { limit: 10, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = updateImageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Imagem inválida', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: parsed.data.image },
      select: { id: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/account/image]', error);
    return NextResponse.json({ error: 'Erro ao atualizar foto.' }, { status: 500 });
  }
}
