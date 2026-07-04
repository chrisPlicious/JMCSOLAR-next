import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  screenOrder,
  fraudMaxOrderCentavos,
  FRAUD_MAX_LINE_QTY,
} from './fraud';

// A baseline valid order; individual tests override one field at a time so each
// assertion isolates the check it's exercising. All money is in centavos.
function validInput(overrides: Partial<Parameters<typeof screenOrder>[0]> = {}) {
  return {
    quantities: [2, 1],
    totalCentavos: 100_000, // ₱1,000
    email: 'buyer@example.com',
    phone: '09171234567', // 11 digits
    ...overrides,
  };
}

describe('screenOrder — happy path', () => {
  it('passes a well-formed order', () => {
    expect(screenOrder(validInput())).toEqual({ ok: true });
  });
});

describe('screenOrder — per-line quantity', () => {
  it('rejects a line quantity over FRAUD_MAX_LINE_QTY', () => {
    const result = screenOrder(validInput({ quantities: [FRAUD_MAX_LINE_QTY + 1] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(String(FRAUD_MAX_LINE_QTY));
  });

  it('allows a line quantity exactly at the cap (boundary)', () => {
    expect(screenOrder(validInput({ quantities: [FRAUD_MAX_LINE_QTY] }))).toEqual({ ok: true });
  });

  it('rejects a zero quantity as invalid', () => {
    const result = screenOrder(validInput({ quantities: [0] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('Invalid item quantity.');
  });

  it('rejects a non-integer quantity as invalid', () => {
    const result = screenOrder(validInput({ quantities: [1.5] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('Invalid item quantity.');
  });

  it('rejects when any line in a multi-line order exceeds the cap', () => {
    const result = screenOrder(validInput({ quantities: [1, FRAUD_MAX_LINE_QTY + 1, 3] }));
    expect(result.ok).toBe(false);
  });
});

describe('screenOrder — order-total ceiling', () => {
  it('defaults the ceiling to ₱500,000 (50,000,000 centavos)', () => {
    expect(fraudMaxOrderCentavos()).toBe(50_000_000);
  });

  it('rejects a total over the ceiling', () => {
    const result = screenOrder(validInput({ totalCentavos: fraudMaxOrderCentavos() + 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('online limit');
  });

  it('allows a total exactly at the ceiling (boundary)', () => {
    expect(screenOrder(validInput({ totalCentavos: fraudMaxOrderCentavos() }))).toEqual({ ok: true });
  });

  it('honors a configured FRAUD_MAX_ORDER_CENTAVOS override', () => {
    vi.stubEnv('FRAUD_MAX_ORDER_CENTAVOS', '1000');
    try {
      expect(fraudMaxOrderCentavos()).toBe(1000);
      expect(screenOrder(validInput({ totalCentavos: 1001 })).ok).toBe(false);
      expect(screenOrder(validInput({ totalCentavos: 1000 })).ok).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('screenOrder — contact details', () => {
  beforeEach(() => {
    // Ensure the default ceiling so total checks don't interfere.
    delete process.env.FRAUD_MAX_ORDER_CENTAVOS;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects a malformed email', () => {
    const result = screenOrder(validInput({ email: 'not-an-email' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('valid email');
  });

  it('rejects an email missing a domain dot', () => {
    expect(screenOrder(validInput({ email: 'buyer@example' })).ok).toBe(false);
  });

  it('rejects a phone with too few digits', () => {
    const result = screenOrder(validInput({ phone: '123' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('valid phone');
  });

  it('rejects a phone with too many digits', () => {
    expect(screenOrder(validInput({ phone: '1234567890123456' })).ok).toBe(false); // 16 digits
  });

  it('accepts a formatted phone with separators (digits within range)', () => {
    expect(screenOrder(validInput({ phone: '+63 917 123 4567' }))).toEqual({ ok: true }); // 12 digits
  });

  it('trims surrounding whitespace before validating the email', () => {
    expect(screenOrder(validInput({ email: '  buyer@example.com  ' }))).toEqual({ ok: true });
  });
});
