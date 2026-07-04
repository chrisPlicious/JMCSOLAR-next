export type CheckoutLineItem = {
  name: string;
  amount: number; // centavos, per unit
  quantity: number;
};

export type CreateCheckoutInput = {
  /**
   * Generic reference id for the thing being paid. For bookings this is the
   * booking id; for orders pass the order id here (the field name is kept for
   * backwards compatibility — `kind` disambiguates).
   */
  bookingId: string;
  /** What this checkout is for. Absent is treated as 'booking' (legacy default). */
  kind?: 'booking' | 'order';
  amount: number; // total in centavos (sum of line items)
  description: string;
  lineItems: CheckoutLineItem[];
  customer: { name: string; email: string | null; phone: string };
  /** Absolute URL PayMongo returns the customer to after checkout. */
  successUrl: string;
  /** Absolute URL PayMongo returns the customer to if they cancel. */
  cancelUrl: string;
};

export type CheckoutSession = {
  sessionId: string;
  /** URL to send the customer to in order to pay. May be relative (stub) or absolute (PayMongo). */
  checkoutUrl: string;
};

export type WebhookEvent =
  | { type: 'payment.paid'; bookingId: string; paymentId: string; sessionId: string }
  | { type: 'payment.failed'; bookingId: string; sessionId: string }
  | { type: 'ignored' };

export interface PaymentProvider {
  readonly name: 'stub' | 'paymongo';
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** HMAC verification of a raw webhook body. Must use the raw bytes, not re-stringified JSON. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
  parseWebhookEvent(rawBody: string): WebhookEvent;
  /**
   * Verify-on-return reconciliation: query a checkout session's payment status.
   * Used when the customer lands back on the confirmation page so payment can be
   * confirmed without relying on a webhook (works on localhost AND prod).
   * Never throws — returns `{ paid:false, paymentId:null }` on any error.
   */
  getCheckoutSessionStatus(sessionId: string): Promise<{ paid: boolean; paymentId: string | null }>;
}
