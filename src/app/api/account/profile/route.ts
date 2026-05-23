import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations/profile';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
      accounts: { select: { provider: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: !!user.password,
    providers: user.accounts.map((a) => a.provider),
  });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success } = rateLimit(`profile:${session.user.id}`, { limit: 10, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Tente novamente em 1 minuto.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email } = parsed.data;
    if (!name && !email) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
    }

    if (email) {
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id: session.user.id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
      },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/account/profile]', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}
