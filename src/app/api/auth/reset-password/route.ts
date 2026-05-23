import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 });
    }

    const body = await request.json();
    const { token, password } = body as { token?: string; password?: string };

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ error: 'Link inválido ou já utilizado.' }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 });
    }

    const hashed = await hash(password, 12);
    await Promise.all([
      prisma.user.update({ where: { email: record.email }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    console.error('[reset-password]', error);
    return NextResponse.json({ error: 'Erro ao redefinir senha.' }, { status: 500 });
  }
}
