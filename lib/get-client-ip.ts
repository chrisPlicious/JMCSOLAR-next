/**
 * Extract the real client IP from request headers.
 * Prefers x-real-ip (set by Vercel/nginx, not spoofable by client).
 * Falls back to the first entry in x-forwarded-for.
 *
 * TRUST ASSUMPTION: this function is only safe behind a trusted reverse proxy
 * (Vercel, nginx) that sets x-real-ip. On a raw server with no proxy, a client
 * can spoof x-forwarded-for and bypass rate limiting. Do not self-host without
 * a proxy that sets x-real-ip.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip')?.trim() ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
