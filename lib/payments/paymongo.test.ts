import { describe, it, expect, vi, beforeEach } from 'vitest';

// getCheckoutSessionStatus calls fetch(); secretKey() throws without a key, so set
// a dummy one in the test env. We stub global.fetch to return controlled payloads.
process.env.PAYMONGO_SECRET_KEY = 'sk_test_dummy';

import { paymongoProvider } from './paymongo';

function mockFetch(impl: () => Partial<Response> | Promise<Partial<Response>>) {
  global.fetch = vi.fn(async () => impl()) as unknown as typeof fetch;
}

function okJson(body: unknown): Partial<Response> {
  return { ok: true, status: 200, json: async () => body };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('getCheckoutSessionStatus', () => {
  it('reports paid when a payment has status "paid" and extracts that payment id', async () => {
    mockFetch(() =>
      okJson({
        data: {
          attributes: {
            payments: [{ id: 'pay_abc', attributes: { status: 'paid' } }],
          },
        },
      }),
    );

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result).toEqual({ paid: true, paymentId: 'pay_abc' });
  });

  it('reports paid via the payment_intent "succeeded" fallback when no payment is marked paid', async () => {
    mockFetch(() =>
      okJson({
        data: {
          attributes: {
            payments: [{ id: 'pay_pending', attributes: { status: 'awaiting_next_action' } }],
            payment_intent: { attributes: { status: 'succeeded' } },
          },
        },
      }),
    );

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result.paid).toBe(true);
    expect(result.paymentId).toBe('pay_pending');
  });

  it('reports not paid when neither a payment nor the intent indicates payment', async () => {
    mockFetch(() =>
      okJson({
        data: {
          attributes: {
            payments: [{ id: 'pay_x', attributes: { status: 'awaiting_payment_method' } }],
            payment_intent: { attributes: { status: 'awaiting_payment_method' } },
          },
        },
      }),
    );

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result.paid).toBe(false);
    expect(result.paymentId).toBe('pay_x');
  });

  it('returns paymentId null when there are no payments on the session', async () => {
    mockFetch(() => okJson({ data: { attributes: { payments: [] } } }));

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result).toEqual({ paid: false, paymentId: null });
  });

  it('returns {paid:false, paymentId:null} on a non-OK response', async () => {
    mockFetch(() => ({ ok: false, status: 404, json: async () => ({}) }));

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result).toEqual({ paid: false, paymentId: null });
  });

  it('returns {paid:false, paymentId:null} when the body is malformed JSON', async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token');
      },
    }));

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result).toEqual({ paid: false, paymentId: null });
  });

  it('returns {paid:false, paymentId:null} when fetch itself rejects', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const result = await paymongoProvider.getCheckoutSessionStatus('cs_1');
    expect(result).toEqual({ paid: false, paymentId: null });
  });
});
