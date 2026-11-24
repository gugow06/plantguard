import { describe, expect, it, vi } from 'vitest';
import { logProcessEvents } from '@/lib/process-log';

const fakeClient = (impl: (args: unknown) => Promise<unknown>) =>
  ({ processEvent: { createMany: vi.fn(impl) } }) as unknown as Parameters<typeof logProcessEvents>[0];

describe('logProcessEvents', () => {
  it('grava os eventos como "real", com atributos em JSON', async () => {
    const client = fakeClient(async () => ({ count: 1 }));
    const ts = new Date('2026-11-24T10:00:00Z');
    await logProcessEvents(client, [
      { caseId: 'c1', activity: 'Imagem capturada', timestamp: ts, resource: 'camera', channel: 'camera', attributes: { a: 1 } },
    ]);
    const call = (client.processEvent.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.data[0]).toMatchObject({ caseId: 'c1', source: 'real', timestamp: ts, attributes: '{"a":1}' });
  });

  it('lista vazia não chama o banco', async () => {
    const client = fakeClient(async () => ({ count: 0 }));
    await logProcessEvents(client, []);
    expect(client.processEvent.createMany).not.toHaveBeenCalled();
  });

  it('erro no banco não derruba o fluxo principal', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = fakeClient(async () => { throw new Error('db fora'); });
    await expect(
      logProcessEvents(client, [{ caseId: 'c1', activity: 'x', resource: 'r', channel: 'upload' }]),
    ).resolves.toBeUndefined();
    expect(spy.mock.calls[0][0]).toContain('process_event_write_failed');
    spy.mockRestore();
  });
});
