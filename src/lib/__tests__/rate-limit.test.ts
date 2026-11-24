import { describe, expect, it, vi } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('permite até o limite e bloqueia a partir daí', () => {
    const key = `t-${Math.random()}`;
    const results = Array.from({ length: 4 }, () => rateLimit(key, { limit: 3 }));
    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results[2].remaining).toBe(0);
  });

  it('libera de novo depois que a janela expira', () => {
    vi.useFakeTimers();
    const key = `t-${Math.random()}`;
    rateLimit(key, { limit: 1, windowMs: 1000 });
    expect(rateLimit(key, { limit: 1, windowMs: 1000 }).success).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, { limit: 1, windowMs: 1000 }).success).toBe(true);
    vi.useRealTimers();
  });
});
