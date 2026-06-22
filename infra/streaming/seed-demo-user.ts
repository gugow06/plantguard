import { hash } from 'bcryptjs';
import { createPrisma, DEMO_USER_EMAIL } from './shared';

/**
 * Garante que o usuário demo do pipeline exista. O consumer atrela todas as
 * análises geradas pelo stream a este usuário, e é com ele que você loga no app
 * para ver o histórico/alertas crescendo em tempo real.
 *
 *   email: agrosmart-stream@demo.local   senha: stream123
 */
async function main() {
  const prisma = createPrisma();
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });

  if (existing) {
    console.log(`[seed] Usuário demo já existe (id: ${existing.id})`);
  } else {
    const user = await prisma.user.create({
      data: {
        name: 'AgroSmart Stream',
        email: DEMO_USER_EMAIL,
        password: await hash('stream123', 12),
      },
    });
    console.log(`[seed] Usuário demo criado: ${DEMO_USER_EMAIL} / senha: stream123 (id: ${user.id})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[seed] erro:', e);
  process.exit(1);
});
