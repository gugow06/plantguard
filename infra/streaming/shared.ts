import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Kafka, logLevel } from 'kafkajs';
import 'dotenv/config';

/**
 * Configuração compartilhada entre producer e consumer do pipeline de streaming.
 * O fluxo simula uma entrada contínua de imagens classificadas chegando ao
 * tópico Kafka e sendo persistidas no Postgres do app (mesmo schema Prisma).
 */

export const TOPIC = process.env.KAFKA_TOPIC ?? 'plant-classifications';
export const BROKERS = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
export const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'agrosmart-pipeline';

/** Usuário demo que recebe as análises geradas pelo stream. */
export const DEMO_USER_EMAIL = process.env.STREAM_USER_EMAIL ?? 'agrosmart-stream@demo.local';

/** Mensagem que trafega no tópico — uma imagem classificada. */
export interface ClassificationMessage {
  /** Caso do processo (event log): acompanha a leitura da captura ao alerta. */
  caseId?: string;
  /** Quando a câmera capturou a imagem e quando o producer publicou no tópico. */
  capturedAt?: string;
  publishedAt?: string;
  imageName: string;
  status: 'Saudável' | 'Doente' | 'Inconclusivo';
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  createdAt: string;
}

export function createKafka() {
  return new Kafka({
    clientId: CLIENT_ID,
    brokers: BROKERS,
    logLevel: logLevel.ERROR,
    retry: { initialRetryTime: 1000, retries: 20 },
  });
}

export function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}
