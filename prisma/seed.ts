import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // --- Criar usuário admin ---
  const email = 'admin@plantguard.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  let userId: string;

  if (existing) {
    console.log(`Usuário ${email} já existe (id: ${existing.id})`);
    userId = existing.id;
  } else {
    const hashedPassword = await hash('admin123', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Admin PlantGuard',
        email,
        password: hashedPassword,
      },
    });
    userId = user.id;
    console.log(`Usuário criado: ${email} / senha: admin123 (id: ${userId})`);
  }

  // --- Inserir dados de exemplo para analytics ---
  const count = await prisma.analysis.count({ where: { userId } });
  if (count > 0) {
    console.log(`Usuário já possui ${count} análises. Pulando seed de dados.`);
    await prisma.$disconnect();
    return;
  }

  const plants = ['Tomate', 'Soja', 'Milho', 'Café', 'Alface', 'Morango', 'Batata', 'Trigo'];
  const pathologies: Record<string, string[]> = {
    Tomate: ['Septoriose', 'Requeima', 'Oídio'],
    Soja: ['Ferrugem Asiática', 'Antracnose', 'Mancha Alvo'],
    Milho: ['Cercosporiose', 'Ferrugem Polissora'],
    Café: ['Ferrugem do Cafeeiro', 'Cercosporiose'],
    Alface: ['Míldio', 'Podridão de Sclerotinia'],
    Morango: ['Botrytis', 'Antracnose'],
    Batata: ['Requeima', 'Pinta Preta'],
    Trigo: ['Ferrugem da Folha', 'Giberela'],
  };

  const analyses = [];
  const now = new Date();

  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 7);

    const plant = plants[Math.floor(Math.random() * plants.length)];
    const rand = Math.random();

    let status: string;
    let pathology: string | null = null;
    let confidence: number;
    let description: string;
    let recommendations: string;

    if (rand < 0.55) {
      status = 'Saudável';
      confidence = 70 + Math.random() * 30;
      description = `A planta de ${plant} apresenta aspecto saudável, com folhas verdes e sem sinais visíveis de doenças ou pragas.`;
      recommendations = 'Manter manejo atual. Monitorar regularmente.';
    } else if (rand < 0.90) {
      status = 'Doente';
      const plantPathologies = pathologies[plant] ?? ['Doença não especificada'];
      pathology = plantPathologies[Math.floor(Math.random() * plantPathologies.length)];
      confidence = 50 + Math.random() * 45;
      description = `Foram identificados sintomas de ${pathology} na planta de ${plant}. Manchas foliares e alterações na coloração são visíveis.`;
      recommendations = `Aplicar tratamento específico para ${pathology}. Consultar um agrônomo para dosagem adequada.`;
    } else {
      status = 'Inconclusivo';
      confidence = 20 + Math.random() * 40;
      description = `A imagem não permite um diagnóstico definitivo para a planta de ${plant}. Qualidade insuficiente ou sintomas ambíguos.`;
      recommendations = 'Enviar nova imagem com melhor resolução e iluminação.';
    }

    analyses.push({
      userId,
      imageName: `analise_${plant.toLowerCase()}_${i + 1}.jpg`,
      imageData: '',
      status,
      confidence: Math.round(confidence * 10) / 10,
      description,
      recommendations,
      plantType: plant,
      pathology,
      createdAt: date,
      updatedAt: date,
    });
  }

  await prisma.analysis.createMany({ data: analyses });
  console.log(`${analyses.length} análises de exemplo criadas.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
