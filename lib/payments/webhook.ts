// Small raw-body readers shared by the booking and orders webhook routes. Kept
// here so the kind-based cross-talk guard parses the body identically in both
// routes. The atomic idempotency claim stays inline in each route's transaction
// (matching the booking pattern) — we don't centralise that.

/** PayMongo delivers every event to all registered webhook URLs. `metadata.kind`
 * (set at checkout-session creation) lets each route early-ignore events that
 * aren't theirs. Absent kind is treated as 'booking' by the caller (legacy default). */
export function kindFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as {
      data?: { attributes?: { data?: { attributes?: { metadata?: { kind?: string } } } } };
    };
    return json.data?.attributes?.data?.attributes?.metadata?.kind ?? null;
  } catch {
    return null;
  }
}

/** The PayMongo event id (`evt_xxx`) used as the idempotency key. */
export function eventIdFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as { data?: { id?: string } };
    return json.data?.id ?? null;
  } catch {
    return null;
  }
}
