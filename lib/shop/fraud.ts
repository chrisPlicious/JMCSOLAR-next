// #7 — Lightweight, app-side fraud guards layered on top of PayMongo's built-in
// screening. This is intentionally NOT a full fraud engine: it rejects obviously
// bad orders (absurd quantities/totals, malformed contact details) before a
// checkout session is created. All money is in centavos.

/** Max units a single line may contain before we treat the order as suspicious. */
export const FRAUD_MAX_LINE_QTY = 50;

/** Configurable order-total ceiling (centavos). Defaults to ₱500,000. */
export function fraudMaxOrderCentavos(): number {
  const raw = Number(process.env.FRAUD_MAX_ORDER_CENTAVOS);
  return Number.isFinite(raw) && raw > 0 ? raw : 50_000_000;
}

// Basic, deliberately loose validators — block clearly malformed input, not edge cases.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ScreenOrderInput {
  /** Per-line quantities being purchased. */
  quantities: number[];
  /** Order total in centavos (subtotal + shipping). */
  totalCentavos: number;
  email: string;
  phone: string;
}

export type ScreenOrderResult = { ok: true } | { ok: false; reason: string };

/**
 * Pure synchronous order screen. Returns `{ ok: false, reason }` on the first
 * failed check so the caller can surface a clean message to the customer.
 */
export function screenOrder(input: ScreenOrderInput): ScreenOrderResult {
  for (const qty of input.quantities) {
    if (!Number.isInteger(qty) || qty <= 0) {
      return { ok: false, reason: 'Invalid item quantity.' };
    }
    if (qty > FRAUD_MAX_LINE_QTY) {
      return {
        ok: false,
        reason: `Quantity per item is limited to ${FRAUD_MAX_LINE_QTY}. Please contact us for bulk orders.`,
      };
    }
  }

  const ceiling = fraudMaxOrderCentavos();
  if (input.totalCentavos > ceiling) {
    return {
      ok: false,
      reason: 'Order total exceeds the online limit. Please contact us to place this order.',
    };
  }

  if (!EMAIL_RE.test(input.email.trim())) {
    return { ok: false, reason: 'Please enter a valid email address.' };
  }

  const digits = input.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, reason: 'Please enter a valid phone number.' };
  }

  return { ok: true };
}
