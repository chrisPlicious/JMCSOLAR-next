import { describe, it, expect } from 'vitest';
import { getClientIp } from './get-client-ip';

describe('getClientIp', () => {
  it('prefers x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '1.2.3.4' });
    expect(getClientIp(headers)).toBe('1.2.3.4');
  });

  it('falls back to x-forwarded-for when x-real-ip absent', () => {
    const headers = new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('9.9.9.9');
  });

  it('returns unknown when no header present', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
