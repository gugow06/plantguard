import { Kafka, type Admin } from 'kafkajs';

/**
 * Admin Kafka singleton usado pela página de monitoramento para ler métricas do
 * tópico (offsets, total de mensagens, lag do consumer). Conexão reaproveitada
 * entre requisições; em caso de erro, é resetada por resetKafkaAdmin().
 */

export const STREAM_TOPIC = process.env.KAFKA_TOPIC ?? 'plant-classifications';
export const CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP ?? 'agrosmart-consumer';
const BROKERS = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

const globalForKafka = globalThis as unknown as {
  kafkaAdmin?: Admin;
  kafkaConnected?: boolean;
};

export async function getKafkaAdmin(): Promise<Admin> {
  if (!globalForKafka.kafkaAdmin) {
    const kafka = new Kafka({
      clientId: 'agrosmart-monitor',
      brokers: BROKERS,
      retry: { retries: 3, initialRetryTime: 300 },
    });
    globalForKafka.kafkaAdmin = kafka.admin();
  }
  if (!globalForKafka.kafkaConnected) {
    await globalForKafka.kafkaAdmin.connect();
    globalForKafka.kafkaConnected = true;
  }
  return globalForKafka.kafkaAdmin;
}

export async function resetKafkaAdmin() {
  try {
    await globalForKafka.kafkaAdmin?.disconnect();
  } catch {
    /* ignore */
  }
  globalForKafka.kafkaAdmin = undefined;
  globalForKafka.kafkaConnected = false;
}

export interface KafkaMetrics {
  topic: string;
  partitions: number;
  totalMessages: number;
  consumerGroup: string;
  lag: number;
  perPartition: { partition: number; high: number; committed: number; lag: number }[];
}

/** Lê offsets do tópico e do consumer group. Retorna null se o Kafka estiver indisponível. */
export async function getKafkaMetrics(): Promise<KafkaMetrics | null> {
  try {
    const admin = await getKafkaAdmin();
    const topicOffsets = await admin.fetchTopicOffsets(STREAM_TOPIC);

    let committedByPartition = new Map<number, number>();
    try {
      const groupOffsets = await admin.fetchOffsets({
        groupId: CONSUMER_GROUP,
        topics: [STREAM_TOPIC],
      });
      const t = groupOffsets.find((g) => g.topic === STREAM_TOPIC);
      committedByPartition = new Map(
        (t?.partitions ?? []).map((p) => [p.partition, Number(p.offset)]),
      );
    } catch {
      /* grupo pode ainda não ter offsets commitados */
    }

    let totalMessages = 0;
    let lag = 0;
    const perPartition = topicOffsets.map((p) => {
      const high = Number(p.high);
      const low = Number(p.low);
      const committedRaw = committedByPartition.get(p.partition);
      const committed = committedRaw !== undefined && committedRaw >= 0 ? committedRaw : low;
      const partitionLag = Math.max(0, high - committed);
      totalMessages += high - low;
      lag += partitionLag;
      return { partition: p.partition, high, committed, lag: partitionLag };
    });

    return {
      topic: STREAM_TOPIC,
      partitions: topicOffsets.length,
      totalMessages,
      consumerGroup: CONSUMER_GROUP,
      lag,
      perPartition,
    };
  } catch {
    await resetKafkaAdmin();
    return null;
  }
}
