import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// One limiter instance per unique (limit, windowMs) pair — lazily created.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
        prefix: 'rl',
      }),
    );
  }
  return limiters.get(key)!;
}

/**
 * Check whether a request from `identifier` is within the rate limit.
 *
 * @param identifier  Unique key (usually client IP)
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window size in milliseconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const result = await getLimiter(limit, windowMs).limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
  };
}
