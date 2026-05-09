import { describe, it, expect } from 'vitest';

describe('rateLimit', () => {
  it('exports a rateLimit function', async () => {
    const mod = await import('./rate-limit');
    expect(typeof mod.rateLimit).toBe('function');
  });
});
