import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, TOKEN_TTL_MS } from '@/lib/auth-constants';

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''} https://*.firebaseio.com https://*.googleapis.com`,
    "img-src 'self' data: https://storage.googleapis.com https://firebasestorage.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "frame-src https://www.google.com",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Verify a `nonce.iat.hmac` session token using Edge-compatible crypto.subtle.
 * Returns true if the HMAC over the nonce.iat matches the one in the token.
 */
async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [nonce, iatHex, providedHmac] = parts;
  if (!nonce || !iatHex || !providedHmac) return false;

  // M1: cap length to prevent overflow with malformed tokens
  if (iatHex.length > 16) return false;
  const iat = parseInt(iatHex, 16);
  if (isNaN(iat) || Date.now() - iat > TOKEN_TTL_MS) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${nonce}.${iatHex}`),
  );

  const expectedHmac = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (providedHmac.length !== expectedHmac.length) return false;
  let diff = 0;
  for (let i = 0; i < providedHmac.length; i++) {
    diff |= providedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
  }
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const csp = buildCsp(nonce);

  // Pass nonce to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  const isLogin = request.nextUrl.pathname.startsWith('/admin/login');

  if (isAdmin && !isLogin) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set('Content-Security-Policy', csp);
      return redirectResponse;
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
