import { NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { setPasswordSchema, updatePasswordSchema } from '@/lib/validations/profile';
import { rateLimit } from '@/lib/rate-limit';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { success } = rateLimit(`password:${session.user.id}`, { limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (user.password) {
      const parsed = updatePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const { currentPassword, newPassword } = parsed.data;
      const ok = await compare(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
      }
      const hashed = await hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });
      return NextResponse.json({ ok: true });
    }

    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const hashed = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PATCH /api/account/password]', error);
    return NextResponse.json({ error: 'Erro ao atualizar senha.' }, { status: 500 });
  }
}
