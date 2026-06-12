import type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  WebhookEvent,
} from './types';

/**
 * Stub provider — no real money moves. createCheckoutSession routes the
 * customer to an internal simulated checkout page (/booking/stub-checkout)
 * that mirrors the PayMongo redirect → pay → return flow, so the whole
 * pay-first booking path is testable before PayMongo keys are wired.
 */
export const stubProvider: PaymentProvider = {
  name: 'stub',

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const sessionId = `stub_${crypto.randomUUID()}`;
    const checkoutUrl =
      `/booking/stub-checkout?booking=${encodeURIComponent(input.bookingId)}` +
      `&session=${encodeURIComponent(sessionId)}` +
      `&amount=${input.amount}`;
    return { sessionId, checkoutUrl };
  },

  verifyWebhookSignature(): boolean {
    // Stub has no real webhook; signature always trusts.
    return true;
  },

  parseWebhookEvent(rawBody: string): WebhookEvent {
    try {
      const b = JSON.parse(rawBody) as Record<string, string>;
      if (!b.bookingId) return { type: 'ignored' };
      return {
        type: 'payment.paid',
        bookingId: b.bookingId,
        paymentId: b.paymentId ?? 'stub_pay',
        sessionId: b.sessionId ?? 'stub_sess',
      };
    } catch {
      return { type: 'ignored' };
    }
  },
};
