import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, TOKEN_TTL_MS } from './auth-constants';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET env var is required');
}

export { SESSION_COOKIE, COOKIE_MAX_AGE, TOKEN_TTL_MS } from './auth-constants';

/**
 * Token format: `<nonce_hex>.<iat_hex>.<hmac_hex>`
 * HMAC covers `nonce.iat` so expiry cannot be forged.
 *
 * Deploy note: format changed from 2-part to 3-part — all existing sessions
 * will be invalidated on first deploy. Admins must log in again.
 */
export function generateSessionToken(): string {
  const nonce = randomBytes(32).toString('hex');
  const iat = Date.now().toString(16);
  const hmac = createHmac('sha256', process.env.SESSION_SECRET!)
    .update(`${nonce}.${iat}`)
    .digest('hex');
  return `${nonce}.${iat}.${hmac}`;
}

/** Verify that a token was issued by this server and has not expired. */
export function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [nonce, iatHex, providedHmac] = parts;
    if (!nonce || !iatHex || !providedHmac) return false;

    // M1: cap length to prevent overflow with malformed tokens
    if (iatHex.length > 16) return false;
    const iat = parseInt(iatHex, 16);
    if (isNaN(iat) || Date.now() - iat > TOKEN_TTL_MS) return false;

    const expectedHmac = createHmac('sha256', process.env.SESSION_SECRET!)
      .update(`${nonce}.${iatHex}`)
      .digest('hex');

    const a = Buffer.from(providedHmac);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Redirects to login if not authenticated — call at top of every server action. */
export async function requireAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    redirect('/admin/login');
  }
}
