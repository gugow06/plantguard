import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { markAlertsSeen } from '@/lib/process-alerts';

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    const unread = await prisma.notification.findMany({
      where: { id, userId: session.user.id, read: false },
      select: { analysisId: true },
    });
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
    await markAlertsSeen(unread);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PATCH /api/notifications/[id]]', error);
    return NextResponse.json({ error: 'Erro ao atualizar notificação.' }, { status: 500 });
  }
}
