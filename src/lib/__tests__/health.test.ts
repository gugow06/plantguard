import { describe, expect, it } from 'vitest';
import { evaluateHealth, httpStatusFor, LAG_THRESHOLD } from '@/lib/health';

const now = new Date('2026-11-24T12:00:00.000Z');
const healthy = {
  database: { up: true, latencyMs: 3 },
  kafka: { up: true, latencyMs: 12, lag: 0, totalMessages: 120 },
  lastConsumedAt: new Date('2026-11-24T11:59:30.000Z'),
  now,
};

describe('evaluateHealth', () => {
  it('tudo de pé: ok e HTTP 200', () => {
    const r = evaluateHealth(healthy);
    expect(r.status).toBe('ok');
    expect(r.issues).toEqual([]);
    expect(r.services.consumer.status).toBe('ok');
    expect(r.services.consumer.lastConsumedAgeSeconds).toBe(30);
    expect(httpStatusFor(r)).toBe(200);
  });

  it('Kafka fora: degraded, mas o app segue respondendo 200', () => {
    const r = evaluateHealth({ ...healthy, kafka: { up: false, latencyMs: null, lag: null, totalMessages: null } });
    expect(r.status).toBe('degraded');
    expect(r.services.kafka.status).toBe('down');
    expect(r.services.consumer.status).toBe('unknown');
    expect(httpStatusFor(r)).toBe(200);
  });

  it('consumer atrasado além do limite: degraded', () => {
    const r = evaluateHealth({ ...healthy, kafka: { ...healthy.kafka, lag: LAG_THRESHOLD + 1 } });
    expect(r.status).toBe('degraded');
    expect(r.services.consumer.status).toBe('lagging');
    expect(r.issues[0]).toMatch(/atrasado/);
  });

  it('banco fora: down e HTTP 503', () => {
    const r = evaluateHealth({ ...healthy, database: { up: false, latencyMs: null } });
    expect(r.status).toBe('down');
    expect(httpStatusFor(r)).toBe(503);
  });

  it('sem nenhuma mensagem consumida ainda: idade nula', () => {
    const r = evaluateHealth({ ...healthy, lastConsumedAt: null });
    expect(r.services.consumer.lastConsumedAt).toBeNull();
    expect(r.services.consumer.lastConsumedAgeSeconds).toBeNull();
  });
});
