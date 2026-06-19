export const SESSION_COOKIE = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours — shorter window limits stolen-token abuse
export const TOKEN_TTL_MS = COOKIE_MAX_AGE * 1000;

// "Remember me" — opt-in longer session so admins aren't re-prompted every 8h.
// The TTL is baked into the (HMAC-signed) token, so it can't be forged; both
// verifiers cap any token's TTL at this value as defence-in-depth.
export const COOKIE_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days
export const TOKEN_TTL_REMEMBER_MS = COOKIE_MAX_AGE_REMEMBER * 1000;
