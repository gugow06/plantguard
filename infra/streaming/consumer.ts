import { createKafka, createPrisma, TOPIC, DEMO_USER_EMAIL, type ClassificationMessage } from './shared';

/**
 * CONSUMER — consome o tópico Kafka e persiste no Postgres do app.
 *
 * Para cada mensagem cria um registro `Analysis` (atrelado ao usuário demo) e,
 * quando o status é "Doente", cria uma `Notification` do tipo "disease_alert" —
 * mesma lógica de src/app/api/analyze/route.ts. Como o dashboard de analytics e
 * a rota de alertas (src/app/api/alerts/route.ts) recalculam a partir das
 * `Analysis`, o app reflete o stream em tempo real, sem código adicional.
 */

const prisma = createPrisma();

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    throw new Error(
      `Usuário demo "${DEMO_USER_EMAIL}" não encontrado. Rode o seed-demo-user antes do consumer.`,
    );
  }
  return user.id;
}

async function persist(userId: string, msg: ClassificationMessage) {
  const analysis = await prisma.analysis.create({
    data: {
      userId,
      imageName: msg.imageName,
      imageData: '', // stream não carrega o binário da imagem
      status: msg.status,
      confidence: msg.confidence,
      description: msg.description,
      recommendations: msg.recommendations,
      plantType: msg.plantType,
      pathology: msg.pathology,
      rawResponse: JSON.stringify(msg),
      createdAt: new Date(msg.createdAt),
    },
  });

  if (msg.status === 'Doente') {
    const title = `Planta doente detectada${msg.plantType ? `: ${msg.plantType}` : ''}`;
    const message = msg.pathology
      ? `${msg.pathology} — ${msg.confidence}% de confiança`
      : `Confiança: ${msg.confidence}%`;

    await prisma.notification.create({
      data: {
        userId,
        type: 'disease_alert',
        title,
        message,
        data: JSON.stringify({ analysisId: analysis.id, ...msg }),
        analysisId: analysis.id,
      },
    });
    console.log(`[consumer] ALERTA criado: ${title} (${msg.confidence}%)`);
  }

  return analysis.id;
}

async function main() {
  const userId = await getDemoUserId();
  const kafka = createKafka();
  const consumer = kafka.consumer({ groupId: 'agrosmart-consumer' });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  console.log(`[consumer] conectado. Consumindo "${TOPIC}" -> Postgres (usuário ${DEMO_USER_EMAIL}).`);

  const shutdown = async () => {
    console.log('\n[consumer] encerrando...');
    await consumer.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const msg = JSON.parse(message.value.toString()) as ClassificationMessage;
        const id = await persist(userId, msg);
        console.log(`[consumer] <- ${msg.imageName} | ${msg.status} | salvo Analysis ${id}`);
      } catch (e) {
        console.error('[consumer] erro ao processar mensagem:', e);
      }
    },
  });
}

main().catch((e) => {
  console.error('[consumer] erro:', e);
  process.exit(1);
});
