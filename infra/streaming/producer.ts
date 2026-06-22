import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { createKafka, TOPIC, type ClassificationMessage } from './shared';

/**
 * PRODUCER — simula a entrada contínua de imagens classificadas.
 *
 * Lê o data/sample-plants.csv (imagens já classificadas) e publica uma mensagem
 * JSON por linha no tópico Kafka, em loop infinito. A cada volta aplica uma leve
 * variação na confiança e usa o timestamp atual, simulando um sensor/câmera de
 * campo enviando novas leituras continuamente.
 */

const INTERVAL_MS = Number(process.env.STREAM_INTERVAL_MS ?? 60_000);
// Total de mensagens a publicar. 0 = ilimitado (loop infinito).
const MAX_MESSAGES = Number(process.env.STREAM_MAX_MESSAGES ?? 10);
const CSV_PATH = process.env.CSV_PATH ?? resolve(process.cwd(), 'data', 'sample-plants.csv');

interface CsvRow {
  imageName: string;
  status: string;
  plantType: string;
  pathology: string;
  confidence: string;
  description: string;
  recommendations: string;
  createdAt: string;
}

function loadRows(): CsvRow[] {
  const file = readFileSync(CSV_PATH, 'utf-8');
  const { data } = Papa.parse<CsvRow>(file, { header: true, skipEmptyLines: true });
  return data;
}

function jitterConfidence(base: number): number {
  const delta = (Math.random() - 0.5) * 6; // ±3 pontos
  return Math.min(100, Math.max(0, Math.round((base + delta) * 10) / 10));
}

function toMessage(row: CsvRow): ClassificationMessage {
  return {
    imageName: row.imageName,
    status: row.status as ClassificationMessage['status'],
    plantType: row.plantType || null,
    pathology: row.pathology || null,
    confidence: jitterConfidence(Number(row.confidence)),
    description: row.description,
    recommendations: row.recommendations,
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  const rows = loadRows();
  if (rows.length === 0) {
    throw new Error(`Nenhuma linha encontrada em ${CSV_PATH}`);
  }

  const kafka = createKafka();
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPIC, numPartitions: 1 }] });
  await admin.disconnect();

  const producer = kafka.producer();
  await producer.connect();
  const limitLabel = MAX_MESSAGES > 0 ? `${MAX_MESSAGES} mensagens` : 'ilimitado';
  console.log(`[producer] conectado. Publicando em "${TOPIC}" — ${limitLabel}, intervalo ${INTERVAL_MS}ms (${rows.length} amostras).`);

  const shutdown = async () => {
    console.log('\n[producer] encerrando...');
    await producer.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Publica MAX_MESSAGES com INTERVAL_MS de espera entre cada uma.
  // (MAX_MESSAGES = 0 → segue indefinidamente.)
  for (let n = 0; MAX_MESSAGES === 0 || n < MAX_MESSAGES; n++) {
    if (n > 0) await new Promise((r) => setTimeout(r, INTERVAL_MS));
    const message = toMessage(rows[n % rows.length]);
    await producer.send({
      topic: TOPIC,
      messages: [{ key: message.imageName, value: JSON.stringify(message) }],
    });
    console.log(`[producer] -> (${n + 1}/${MAX_MESSAGES || '∞'}) ${message.imageName} | ${message.status} | ${message.plantType ?? '-'} | ${message.confidence}%`);
  }

  console.log(`[producer] concluído: ${MAX_MESSAGES} mensagens publicadas.`);
  await producer.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('[producer] erro:', e);
  process.exit(1);
});
