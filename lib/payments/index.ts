import type { PaymentProvider } from './types';
import { stubProvider } from './stub';
import { paymongoProvider } from './paymongo';

let cached: PaymentProvider | null = null;

/**
 * Returns the active payment provider based on PAYMENT_PROVIDER env.
 * Defaults to the stub provider so the booking flow works without keys.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const name = (process.env.PAYMENT_PROVIDER ?? 'stub').toLowerCase();
  cached = name === 'paymongo' ? paymongoProvider : stubProvider;
  return cached;
}

export type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  CheckoutLineItem,
  WebhookEvent,
} from './types';
