import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, TOKEN_TTL_MS, TOKEN_TTL_REMEMBER_MS } from './auth-constants';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET env var is required');
}

export {
  SESSION_COOKIE,
  COOKIE_MAX_AGE,
  COOKIE_MAX_AGE_REMEMBER,
  TOKEN_TTL_MS,
  TOKEN_TTL_REMEMBER_MS,
} from './auth-constants';

/**
 * Token format: `<nonce_hex>.<iat_hex>.<ttl_hex>.<hmac_hex>`
 * HMAC covers `nonce.iat.ttl` so neither expiry nor the chosen lifetime can be
 * forged. The per-token `ttl` lets "remember me" issue a longer-lived session
 * without a separate token type.
 *
 * Deploy note: format changed from 3-part to 4-part — all existing sessions
 * will be invalidated on first deploy. Admins must log in again.
 */
export function generateSessionToken(ttlMs: number = TOKEN_TTL_MS): string {
  const nonce = randomBytes(32).toString('hex');
  const iat = Date.now().toString(16);
  // Never sign a TTL longer than the allowed maximum.
  const ttl = Math.min(ttlMs, TOKEN_TTL_REMEMBER_MS).toString(16);
  const hmac = createHmac('sha256', process.env.SESSION_SECRET!)
    .update(`${nonce}.${iat}.${ttl}`)
    .digest('hex');
  return `${nonce}.${iat}.${ttl}.${hmac}`;
}

/** Verify that a token was issued by this server and has not expired. */
export function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 4) return false;

    const [nonce, iatHex, ttlHex, providedHmac] = parts;
    if (!nonce || !iatHex || !ttlHex || !providedHmac) return false;

    // M1: cap length to prevent overflow with malformed tokens
    if (iatHex.length > 16 || ttlHex.length > 16) return false;
    const iat = parseInt(iatHex, 16);
    const ttl = Math.min(parseInt(ttlHex, 16), TOKEN_TTL_REMEMBER_MS);
    if (isNaN(iat) || isNaN(ttl) || Date.now() - iat > ttl) return false;

    const expectedHmac = createHmac('sha256', process.env.SESSION_SECRET!)
      .update(`${nonce}.${iatHex}.${ttlHex}`)
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
