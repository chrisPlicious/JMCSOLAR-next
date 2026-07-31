// Canonical host is WWW (non-www 307-redirects to www in production). The fallback
// matches that so canonicals never point at the redirecting non-www host if the
// NEXT_PUBLIC_SITE_URL env var is ever missing. Trailing slash stripped defensively.
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.jmcsolarph.com';
export const SITE_URL = RAW_SITE_URL.replace(/\/$/, '');
