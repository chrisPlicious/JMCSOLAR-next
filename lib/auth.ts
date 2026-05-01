import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Generate a unique session token.
 *
 * Each call produces a different token by including a random 32-byte nonce.
 * Format: `<nonce_hex>.<hmac_hex>`
 * The HMAC covers the nonce so the token can be verified without a DB lookup.
 */
export function generateSessionToken(): string {
  const nonce = randomBytes(32).toString('hex');
  const hmac = createHmac('sha256', process.env.SESSION_SECRET!)
    .update(nonce)
    .digest('hex');
  return `${nonce}.${hmac}`;
}

/** Verify that a token was issued by this server (constant-time). */
export function verifySessionToken(token: string): boolean {
  try {
    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) return false;

    const nonce = token.slice(0, dotIndex);
    const providedHmac = token.slice(dotIndex + 1);

    // Reject malformed tokens early
    if (!nonce || !providedHmac) return false;

    const expectedHmac = createHmac('sha256', process.env.SESSION_SECRET!)
      .update(nonce)
      .digest('hex');

    const a = Buffer.from(providedHmac);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Throws if the request is not authenticated — call at top of every server action */
export async function requireAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    throw new Error('Unauthorized');
  }
}
