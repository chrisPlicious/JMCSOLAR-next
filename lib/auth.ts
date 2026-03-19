import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Generate the expected session token from env vars */
export function generateSessionToken(): string {
  return createHmac('sha256', process.env.SESSION_SECRET!)
    .update(process.env.ADMIN_PASSWORD!)
    .digest('hex');
}

/** Constant-time comparison to prevent timing attacks */
export function verifySessionToken(token: string): boolean {
  try {
    const expected = generateSessionToken();
    const a = Buffer.from(token.padEnd(64, '0'));
    const b = Buffer.from(expected.padEnd(64, '0'));
    return timingSafeEqual(a, b) && token.length === expected.length;
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
