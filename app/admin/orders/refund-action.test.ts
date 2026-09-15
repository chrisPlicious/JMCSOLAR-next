import { describe, it, expect, vi, beforeEach } from 'vitest';

// refundOrderAction is gated by the ORDER refund kill switch; recordManualRefundAction
// deliberately is NOT. These tests pin that asymmetry, because getting it backwards
// either (a) lets an impossible QRPh refund hit PayMongo, or (b) leaves admins unable
// to reconcile a refund they already paid out by hand.
const h = vi.hoisted(() => {
  const requireAdminAuth = vi.fn(async () => undefined);
  const revalidatePath = vi.fn();
  const notifyOrderRefunded = vi.fn(async () => undefined);
  // Annotate the return types: without them vitest infers the literal from the
  // default implementation and mockResolvedValueOnce('duplicate') stops typechecking.
  const applyRefundToOrder = vi.fn(
    async (): Promise<'refunded' | 'duplicate' | 'missing'> => 'refunded',
  );
  const recordManualRefund = vi.fn(
    async (): Promise<{ ok: true; amountCentavos: number } | { ok: false; error: string }> => ({
      ok: true,
      amountCentavos: 50000,
    }),
  );
  const orderRefundsEnabled = vi.fn(() => false);

  let orderData: Record<string, unknown> | undefined = {
    payment_status: 'paid',
    total_centavos: 50000,
    payment_reference: 'pay_abc',
  };
  const orderRef = {
    get: async () => ({
      exists: orderData !== undefined,
      id: 'order-1',
      data: () => orderData,
    }),
    update: vi.fn(),
  };
  const collectionSpy = vi.fn((name: string) => {
    if (name === 'orders') return { doc: (_id: string) => orderRef };
    throw new Error(`unexpected collection ${name}`);
  });

  return {
    requireAdminAuth,
    revalidatePath,
    notifyOrderRefunded,
    applyRefundToOrder,
    recordManualRefund,
    orderRefundsEnabled,
    collectionSpy,
    setOrder: (d: Record<string, unknown> | undefined) => {
      orderData = d;
    },
  };
});

vi.mock('@/lib/auth', () => ({ requireAdminAuth: h.requireAdminAuth }));
vi.mock('@/lib/firebase/admin', () => ({ adminDb: { collection: h.collectionSpy } }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/lib/shop/notifications', () => ({ notifyOrderRefunded: h.notifyOrderRefunded }));
vi.mock('@/lib/shop/refunds', () => ({
  applyRefundToOrder: h.applyRefundToOrder,
  recordManualRefund: h.recordManualRefund,
}));
vi.mock('@/lib/shop/refund-switch', () => ({
  orderRefundsEnabled: h.orderRefundsEnabled,
  ORDER_REFUNDS_DISABLED_MESSAGE: 'DISABLED_MSG',
}));

import { refundOrderAction, recordManualRefundAction } from './actions';

const fetchSpy = vi.fn();
vi.stubGlobal('fetch', fetchSpy);

beforeEach(() => {
  vi.clearAllMocks();
  h.orderRefundsEnabled.mockReturnValue(false);
  h.setOrder({ payment_status: 'paid', total_centavos: 50000, payment_reference: 'pay_abc' });
  h.applyRefundToOrder.mockResolvedValue('refunded');
  h.recordManualRefund.mockResolvedValue({ ok: true, amountCentavos: 50000 });
  process.env.PAYMONGO_SECRET_KEY = 'sk_test_x';
});

describe('refundOrderAction — kill switch OFF', () => {
  it('refuses without contacting PayMongo or touching Firestore', async () => {
    const result = await refundOrderAction('order-1');

    expect(result).toEqual({ error: 'DISABLED_MSG' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(h.applyRefundToOrder).not.toHaveBeenCalled();
    expect(h.notifyOrderRefunded).not.toHaveBeenCalled();
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('still enforces admin auth before the switch check', async () => {
    h.requireAdminAuth.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(refundOrderAction('order-1')).rejects.toThrow('Unauthorized');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('refundOrderAction — kill switch ON', () => {
  beforeEach(() => {
    h.orderRefundsEnabled.mockReturnValue(true);
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'ref_123' } }),
    });
  });

  it('calls PayMongo then syncs through the shared refund transaction', async () => {
    const result = await refundOrderAction('order-1');

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.paymongo.com/v1/refunds');
    expect(JSON.parse((init as { body: string }).body).data.attributes).toMatchObject({
      amount: 50000,
      payment_id: 'pay_abc',
    });
    expect(h.applyRefundToOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', refundId: 'ref_123', method: 'provider' }),
    );
    expect(h.notifyOrderRefunded).toHaveBeenCalledWith('order-1', 50000);
  });

  it('does not email a second time when the transaction reports a duplicate', async () => {
    h.applyRefundToOrder.mockResolvedValueOnce('duplicate');
    const result = await refundOrderAction('order-1');

    expect(result).toEqual({ success: true });
    expect(h.notifyOrderRefunded).not.toHaveBeenCalled();
  });

  it('surfaces the refund id when the Firestore sync fails after the money moved', async () => {
    h.applyRefundToOrder.mockRejectedValueOnce(new Error('firestore down'));
    const result = await refundOrderAction('order-1');

    expect(result.error).toContain('ref_123');
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('does not call PayMongo when the order is already refunded', async () => {
    h.setOrder({ payment_status: 'refunded', total_centavos: 50000, payment_reference: 'pay_abc' });
    const result = await refundOrderAction('order-1');

    expect(result).toEqual({ error: 'This order is already refunded.' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an amount above the order total before calling PayMongo', async () => {
    const result = await refundOrderAction('order-1', 999999);

    expect(result).toEqual({ error: 'Refund amount exceeds the order total.' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an order with no payment reference', async () => {
    h.setOrder({ payment_status: 'paid', total_centavos: 50000, payment_reference: null });
    const result = await refundOrderAction('order-1');

    expect(result).toEqual({ error: 'Order has no payment reference — cannot issue refund.' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports a PayMongo error without mutating the order', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 402, text: async () => 'card declined' });
    const result = await refundOrderAction('order-1');

    expect(result.error).toContain('402');
    expect(h.applyRefundToOrder).not.toHaveBeenCalled();
  });
});

describe('recordManualRefundAction', () => {
  it('works while the kill switch is OFF — that is the whole point', async () => {
    h.orderRefundsEnabled.mockReturnValue(false);

    const result = await recordManualRefundAction('order-1', undefined, 'BPI transfer 998877');

    expect(result).toEqual({ success: true });
    expect(fetchSpy).not.toHaveBeenCalled(); // never contacts the provider
    expect(h.recordManualRefund).toHaveBeenCalledWith({
      orderId: 'order-1',
      amountCentavos: undefined,
      note: 'BPI transfer 998877',
      actor: 'admin',
    });
    expect(h.notifyOrderRefunded).toHaveBeenCalledWith('order-1', 50000);
    expect(h.revalidatePath).toHaveBeenCalledWith('/admin/orders/order-1');
  });

  it('normalises a blank note to null', async () => {
    await recordManualRefundAction('order-1', 25000, '   ');
    expect(h.recordManualRefund).toHaveBeenCalledWith(
      expect.objectContaining({ note: null, amountCentavos: 25000 }),
    );
  });

  it('propagates a validation failure and sends no email', async () => {
    h.recordManualRefund.mockResolvedValueOnce({
      ok: false,
      error: 'Only a paid order can be refunded.',
    });

    const result = await recordManualRefundAction('order-1');

    expect(result).toEqual({ error: 'Only a paid order can be refunded.' });
    expect(h.notifyOrderRefunded).not.toHaveBeenCalled();
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('enforces admin auth', async () => {
    h.requireAdminAuth.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(recordManualRefundAction('order-1')).rejects.toThrow('Unauthorized');
    expect(h.recordManualRefund).not.toHaveBeenCalled();
  });
});
