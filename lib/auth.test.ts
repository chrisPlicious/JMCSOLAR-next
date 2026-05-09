import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('SESSION_SECRET', 'test-secret-32-bytes-minimum-ok!!');

// Top-level await requires ESM — tsconfig has "module": "esnext" so this is safe.
// If you see a compile error here, verify tsconfig.json "module" is "esnext" or "nodenext".
const { generateSessionToken, verifySessionToken } = await import('./auth');

describe('session tokens', () => {
  it('verifies a freshly generated token', () => {
    const token = generateSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it('rejects a tampered token', () => {
    const token = generateSessionToken();
    expect(verifySessionToken(token + 'x')).toBe(false);
  });

  it('rejects a token with wrong structure', () => {
    expect(verifySessionToken('abc.def')).toBe(false);
    expect(verifySessionToken('onlyone')).toBe(false);
    expect(verifySessionToken('')).toBe(false);
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    const token = generateSessionToken();
    vi.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours — past TOKEN_TTL_MS
    expect(verifySessionToken(token)).toBe(false);
    vi.useRealTimers();
  });

  it('each generated token is unique', () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
});
