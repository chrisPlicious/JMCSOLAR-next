export type CheckoutLineItem = {
  name: string;
  amount: number; // centavos, per unit
  quantity: number;
};

export type CreateCheckoutInput = {
  bookingId: string;
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
}
