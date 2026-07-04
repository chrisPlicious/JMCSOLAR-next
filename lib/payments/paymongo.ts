import crypto from 'crypto';
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  WebhookEvent,
} from './types';

const API_BASE = 'https://api.paymongo.com/v1';

function secretKey(): string {
  // trim() guards against a stray BOM/whitespace pasted into the env value.
  const key = process.env.PAYMONGO_SECRET_KEY?.trim();
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set');
  return key;
}

function authHeader(): string {
  // PayMongo uses HTTP Basic auth: base64("<secret_key>:")
  return `Basic ${Buffer.from(`${secretKey()}:`).toString('base64')}`;
}

// Enabled checkout payment methods. Configurable via PAYMONGO_PAYMENT_METHODS
// (comma-separated, e.g. "qrph" or "gcash,paymaya,card") so a partial live
// go-live works: PayMongo rejects the whole session if it lists a method that
// isn't activated on the account. Defaults to the full set when unset.
function paymentMethodTypes(): string[] {
  const raw = (process.env.PAYMONGO_PAYMENT_METHODS ?? '').trim();
  if (!raw) return ['gcash', 'paymaya', 'card'];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * PayMongo provider. Verify request/response shapes against the PayMongo
 * MCP docs server (checkout_sessions reference + webhook signature) before
 * going live.
 */
export const paymongoProvider: PaymentProvider = {
  name: 'paymongo',

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    // Both bookings and orders flow through this provider. metadata.kind lets the
    // (kind-specific) webhook routes early-ignore events that aren't theirs, since
    // PayMongo delivers every event to all registered webhook URLs.
    const kind = input.kind ?? 'booking';
    const metadata: Record<string, string> =
      kind === 'order'
        ? { kind, order_id: input.bookingId }
        : { kind, booking_id: input.bookingId };

    const res = await fetch(`${API_BASE}/checkout_sessions`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: input.lineItems.map((li) => ({
              name: li.name,
              amount: li.amount, // centavos
              currency: 'PHP',
              quantity: li.quantity,
            })),
            payment_method_types: paymentMethodTypes(),
            description: input.description,
            reference_number: input.bookingId,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            send_email_receipt: true,
            metadata,
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PayMongo checkout_session failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      data?: { id?: string; attributes?: { checkout_url?: string } };
    };
    const sessionId = json.data?.id;
    const checkoutUrl = json.data?.attributes?.checkout_url;
    if (!sessionId || !checkoutUrl) {
      throw new Error('PayMongo checkout_session response missing id/checkout_url');
    }
    return { sessionId, checkoutUrl };
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) return false;

    // Header format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k.trim(), (v ?? '').trim()];
      }),
    ) as { t?: string; te?: string; li?: string };

    const timestamp = parts.t;
    if (!timestamp) return false;

    // No timestamp-age / replay window here: PayMongo retries a failed delivery
    // up to 12 times over ~136 min (exponential backoff), and its own reference
    // verifier performs NO timestamp check. Rejecting old timestamps would 401
    // legitimate retries and lose the event. Replay protection is handled by the
    // idempotency event-id claim in the webhook route, not by the clock.
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    return [parts.te, parts.li].some((candidate) => {
      if (!candidate || candidate.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
    });
  },

  parseWebhookEvent(rawBody: string): WebhookEvent {
    try {
      const json = JSON.parse(rawBody) as {
        data?: {
          attributes?: {
            type?: string;
            data?: {
              id?: string;
              attributes?: {
                metadata?: { booking_id?: string };
                reference_number?: string;
                payments?: { id?: string }[];
                payment_intent?: { id?: string };
              };
            };
          };
        };
      };

      const type = json.data?.attributes?.type;
      const resource = json.data?.attributes?.data;
      const attrs = resource?.attributes;
      const bookingId =
        attrs?.metadata?.booking_id ?? attrs?.reference_number ?? '';

      if (!bookingId) return { type: 'ignored' };

      if (type === 'checkout_session.payment.paid') {
        // Resource is the checkout session (cs_xxx); payment id lives in payments[].
        return {
          type: 'payment.paid',
          bookingId,
          paymentId: attrs?.payments?.[0]?.id ?? '',
          sessionId: resource?.id ?? '',
        };
      }
      if (type === 'payment.paid') {
        // Resource IS the payment (pay_xxx) — its own id is the payment id.
        return {
          type: 'payment.paid',
          bookingId,
          paymentId: resource?.id ?? '',
          sessionId: '',
        };
      }
      if (type === 'payment.failed') {
        return { type: 'payment.failed', bookingId, sessionId: '' };
      }
      return { type: 'ignored' };
    } catch {
      return { type: 'ignored' };
    }
  },

  async getCheckoutSessionStatus(
    sessionId: string,
  ): Promise<{ paid: boolean; paymentId: string | null }> {
    // Defensive throughout (mirrors parseWebhookEvent): a verify-on-return failure
    // must never throw — it just means "not confirmed yet" and the page stays pending.
    try {
      const res = await fetch(`${API_BASE}/checkout_sessions/${sessionId}`, {
        method: 'GET',
        headers: { Authorization: authHeader() },
      });
      if (!res.ok) return { paid: false, paymentId: null };

      const json = (await res.json()) as {
        data?: {
          attributes?: {
            payments?: { id?: string; attributes?: { status?: string } }[];
            payment_intent?: { attributes?: { status?: string } };
          };
        };
      };

      const attrs = json.data?.attributes;
      const payments = attrs?.payments ?? [];
      const paidByPayment = payments.some((p) => p?.attributes?.status === 'paid');
      const paidByIntent = attrs?.payment_intent?.attributes?.status === 'succeeded';

      return {
        paid: paidByPayment || paidByIntent,
        paymentId: payments[0]?.id ?? null,
      };
    } catch {
      return { paid: false, paymentId: null };
    }
  },
};
