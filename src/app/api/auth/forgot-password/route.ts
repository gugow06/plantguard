import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const EXPIRY_MS = 60 * 60 * 1000; // 1 hora

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 });
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    // Não vazar se o email existe ou não
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Se este email existir, você receberá as instruções.' });
    }

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: { id: randomBytes(8).toString('hex'), email, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'PlantGuard AI <onboarding@resend.dev>',
      to: email,
      subject: 'Redefinição de senha — PlantGuard AI',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
            <div style="background:#2d6a4f;border-radius:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:20px;">🌿</span>
            </div>
            <span style="font-size:20px;font-weight:700;color:#1a1a2e;">PlantGuard AI</span>
          </div>
          <h2 style="color:#1a1a2e;margin:0 0 8px;">Redefinição de senha</h2>
          <p style="color:#4b5563;line-height:1.6;">Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#2d6a4f;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">Redefinir minha senha</a>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px;">Se você não solicitou isso, ignore este email. O link expirará automaticamente.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:8px;word-break:break-all;">Ou copie: ${resetUrl}</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Se este email existir, você receberá as instruções.' });
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação.' }, { status: 500 });
  }
}
