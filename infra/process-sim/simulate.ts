import { createPrisma } from '../streaming/shared';
import { ACTIVITIES as A } from '../../src/lib/process-mining';

/**
 * SIMULADOR DO PROCESSO — gera um event log reproduzível (seed fixa) com as
 * variações que aparecem no campo e que o fluxo real de demonstração não produz
 * sozinho em poucos minutos: falha da IA com nova tentativa, diagnóstico
 * inconclusivo com nova foto, picos de atraso do consumer, alertas vistos só no
 * dia seguinte ou nunca vistos, e relatório enviado dias depois.
 *
 * Os eventos são gravados com source = "simulado" (os reais ficam com "real") e
 * NÃO criam análises nem notificações: só alimentam a mineração de processos.
 *
 * Uso (dentro da rede do compose, banco local):
 *   docker compose -f infra/docker-compose.yml run --rm init tsx infra/process-sim/simulate.ts
 * Variáveis: SIM_CASES (400), SIM_DAYS (21), SIM_SEED (7), SIM_END (agora).
 */

const CASES = Number(process.env.SIM_CASES ?? 400);
const DAYS = Number(process.env.SIM_DAYS ?? 21);
const SEED = Number(process.env.SIM_SEED ?? 7);
const END = process.env.SIM_END ? new Date(process.env.SIM_END) : new Date();

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const BRT = -3 * HOUR; // horário de Brasília

// ───────────── aleatoriedade reproduzível ─────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const chance = (p: number) => rand() < p;
const uniform = (min: number, max: number) => min + rand() * (max - min);
/** Log-normal pela mediana (tempos humanos e de rede têm cauda longa). */
const lognormal = (median: number, sigma: number) => {
  const u1 = Math.max(rand(), 1e-12);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
  return median * Math.exp(sigma * z);
};
const pick = <T,>(items: [T, number][]): T => {
  let r = rand() * items.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[items.length - 1][0];
};

// ───────────── calendário ─────────────
const localHour = (t: number) => new Date(t + BRT).getUTCHours() + new Date(t + BRT).getUTCMinutes() / 60;
const localDay = (t: number) => new Date(t + BRT).getUTCDay();
const isWorkHours = (t: number) => localDay(t) >= 1 && localDay(t) <= 5 && localHour(t) >= 7 && localHour(t) < 18;
/** Próximo início de expediente (seg–sex, ~07h–09h) a partir de t. */
function nextWorkMorning(t: number): number {
  const local = new Date(t + BRT);
  local.setUTCHours(0, 0, 0, 0);
  let day = local.getTime() - BRT + DAY;
  while (localDay(day + 12 * HOUR) === 0 || localDay(day + 12 * HOUR) === 6) day += DAY;
  return day + uniform(7, 9) * HOUR;
}
/** Instante aleatório dentro do período, num horário de campo (06h–19h). */
function captureTime(): number {
  const start = END.getTime() - DAYS * DAY;
  const dayStart = start + Math.floor(rand() * DAYS) * DAY;
  const local = new Date(dayStart + BRT);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() - BRT + uniform(6, 19) * HOUR;
}

interface SimEvent {
  caseId: string;
  activity: string;
  timestamp: Date;
  resource: string;
  channel: 'camera' | 'upload';
  source: 'simulado';
  attributes: string | null;
}

function simulateCase(index: number): SimEvent[] {
  // Id determinístico: mesma seed gera o mesmo log.
  const caseId = `sim-${SEED}-${String(index + 1).padStart(4, '0')}`;
  const channel = pick<'camera' | 'upload'>([['camera', 0.65], ['upload', 0.35]]);
  const out: SimEvent[] = [];
  let t = captureTime();
  const add = (activity: string, resource: string, attrs?: Record<string, unknown>) =>
    out.push({
      caseId,
      activity,
      timestamp: new Date(t),
      resource,
      channel,
      source: 'simulado',
      attributes: attrs ? JSON.stringify(attrs) : null,
    });

  let status: 'Saudável' | 'Doente' | 'Inconclusivo';

  if (channel === 'camera') {
    // Câmera de campo: imagem já classificada na borda e enviada ao Kafka.
    status = pick([['Saudável', 0.6], ['Doente', 0.32], ['Inconclusivo', 0.08]]);
    add(A.CAPTURA, 'camera-campo');
    t += uniform(40, 250);
    add(A.PUBLICADA, 'producer');
    // 4% dos casos pegam o consumer reiniciando/atrasado (fila acumulada).
    t += chance(0.04) ? uniform(2, 25) * MIN : uniform(15, 180);
    add(A.CONSUMIDA, 'consumer');
    t += uniform(5, 40);
    add(A.REGISTRADA, 'postgres', { status });
  } else {
    // Upload no app: foto do produtor diagnosticada pelo Gemini.
    add(A.CAPTURA, 'produtor');
    let attempts = 0;
    for (;;) {
      attempts++;
      if (chance(0.06)) {
        t += uniform(8, 30) * 1000; // timeout/erro da API de IA
        add(A.FALHA_IA, 'gemini');
        if (attempts >= 2 || chance(0.2)) return out; // produtor desiste
        t += lognormal(1.5 * MIN, 0.8); // tenta de novo
        add(A.CAPTURA, 'produtor');
        continue;
      }
      t += lognormal(4500, 0.35);
      status = pick([['Saudável', 0.52], ['Doente', 0.34], ['Inconclusivo', attempts > 1 ? 0.06 : 0.14]]);
      add(A.DIAGNOSTICO, 'gemini', { status });
      if (status === 'Inconclusivo') {
        t += uniform(1, 5);
        add(A.INCONCLUSIVO, 'gemini');
        if (attempts < 3 && chance(0.7)) {
          t += lognormal(12 * MIN, 0.9); // produtor volta ao talhão e fotografa de novo
          add(A.CAPTURA, 'produtor');
          continue;
        }
      }
      break;
    }
    t += uniform(30, 150);
    add(A.REGISTRADA, 'postgres', { status });
  }

  if (status === 'Doente') {
    t += uniform(100, 800);
    add(A.ALERTA, 'motor-de-regras');
    const alertAt = t;
    if (isWorkHours(alertAt)) {
      if (chance(0.86)) {
        t = alertAt + lognormal(35 * MIN, 1.1);
        add(A.VISUALIZADO, 'produtor');
      }
    } else if (chance(0.7)) {
      // Alerta à noite/fim de semana: visto só no próximo expediente.
      t = Math.max(alertAt + 5 * MIN, nextWorkMorning(alertAt) + lognormal(40 * MIN, 0.9));
      add(A.VISUALIZADO, 'produtor');
    }
  }

  // Parte dos casos entra num relatório por e-mail enviado dias depois.
  if (chance(0.3)) {
    t += uniform(1, 4) * DAY;
    add(A.RELATORIO, 'e-mail');
  }

  // Não gera eventos no futuro.
  return out.filter((e) => e.timestamp.getTime() <= END.getTime());
}

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? '';
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  const local = ['localhost', '127.0.0.1', 'postgres'].includes(host);
  if (!local && process.env.SIM_ALLOW_REMOTE !== '1') {
    throw new Error(
      `Banco "${host || '?'}" não é local. O simulador só grava no Postgres do compose ` +
        '(defina SIM_ALLOW_REMOTE=1 se quiser mesmo gravar em outro banco).',
    );
  }
}

async function main() {
  assertLocalDatabase();
  const prisma = createPrisma();
  const events = Array.from({ length: CASES }, (_, i) => simulateCase(i)).flat();

  const removed = await prisma.processEvent.deleteMany({ where: { source: 'simulado' } });
  for (let i = 0; i < events.length; i += 1000) {
    await prisma.processEvent.createMany({ data: events.slice(i, i + 1000) });
  }

  const cases = new Set(events.map((e) => e.caseId)).size;
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: 'process-sim',
      event: 'simulation_written',
      seed: SEED,
      days: DAYS,
      cases,
      events: events.length,
      replacedEvents: removed.count,
    }),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[process-sim] erro:', e instanceof Error ? e.message : e);
  process.exit(1);
});
