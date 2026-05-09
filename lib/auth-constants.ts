export const SESSION_COOKIE = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours — shorter window limits stolen-token abuse
export const TOKEN_TTL_MS = COOKIE_MAX_AGE * 1000;
