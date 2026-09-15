import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder } from '@/lib/firebase/types';

// createManualOrderAction composes shared pieces: buildOrderLines (pricing),
// getShippingFee, and markOrderPaid (stock decrement + audit). We mock those and
// assert the composition — that it never invents its own prices or stock logic.
const h = vi.hoisted(() => {
  const requireAdminAuth = vi.fn(async () => undefined);
  const revalidatePath = vi.fn();
  const buildOrderLines = vi.fn(
    async (): Promise<
      | { ok: true; items: unknown[]; subtotalCentavos: number }
      | { ok: false; error: string }
    > => ({
      ok: true,
      items: [
        {
          shop_item_id: 'item-1',
          variant_id: null,
          name: 'Solar Flood Light',
          sku: 'SFL-01',
          unit_price_centavos: 50000,
          quantity: 2,
          line_total_centavos: 100000,
        },
      ],
      subtotalCentavos: 100000,
    }),
  );
  const getShippingFee = vi.fn(() => 30000);
  const markOrderPaid = vi.fn(
    async (): Promise<{ order: DbOrder; transitioned: boolean } | null> => ({
      order: {} as DbOrder,
      transitioned: true,
    }),
  );
  const notifyOrderPaid = vi.fn(async () => undefined);
  const notifyOrderReceived = vi.fn(async () => undefined);

  // Declare the parameter so `setSpy.mock.calls[0][0]` is typed (an argument-less
  // vi.fn() infers an empty call tuple and indexing it fails typecheck).
  const setSpy = vi.fn(async (_doc: unknown) => undefined);
  const collectionSpy = vi.fn((name: string) => {
    if (name === 'orders') return { doc: (_id?: string) => ({ id: 'order-new', set: setSpy }) };
    throw new Error(`unexpected collection ${name}`);
  });

  return {
    requireAdminAuth,
    revalidatePath,
    buildOrderLines,
    getShippingFee,
    markOrderPaid,
    notifyOrderPaid,
    notifyOrderReceived,
    setSpy,
    collectionSpy,
  };
});

vi.mock('@/lib/auth', () => ({ requireAdminAuth: h.requireAdminAuth }));
vi.mock('@/lib/firebase/admin', () => ({ adminDb: { collection: h.collectionSpy } }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/lib/shop/order-lines', () => ({ buildOrderLines: h.buildOrderLines }));
vi.mock('@/lib/shop/shipping', () => ({ getShippingFee: h.getShippingFee }));
vi.mock('@/lib/shop/orders', () => ({ markOrderPaid: h.markOrderPaid }));
vi.mock('@/lib/shop/refunds', () => ({ applyRefundToOrder: vi.fn(), recordManualRefund: vi.fn() }));
vi.mock('@/lib/shop/refund-switch', () => ({
  orderRefundsEnabled: () => false,
  ORDER_REFUNDS_DISABLED_MESSAGE: 'DISABLED_MSG',
}));
vi.mock('@/lib/shop/notifications', () => ({
  notifyOrderRefunded: vi.fn(),
  notifyOrderPaid: h.notifyOrderPaid,
  notifyOrderReceived: h.notifyOrderReceived,
}));

import { createManualOrderAction, type ManualOrderInput } from './actions';

function input(over: Partial<ManualOrderInput> = {}): ManualOrderInput {
  return {
    lines: [{ shopItemId: 'item-1', variantId: null, quantity: 2 }],
    customer: { name: 'Juan Dela Cruz', email: '', phone: '09171234567', address: null },
    region: 'ormoc_city',
    fulfillmentMethod: 'pickup',
    markPaid: true,
    notifyCustomer: false,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.buildOrderLines.mockResolvedValue({
    ok: true,
    items: [
      {
        shop_item_id: 'item-1',
        variant_id: null,
        name: 'Solar Flood Light',
        sku: 'SFL-01',
        unit_price_centavos: 50000,
        quantity: 2,
        line_total_centavos: 100000,
      },
    ],
    subtotalCentavos: 100000,
  });
  h.getShippingFee.mockReturnValue(30000);
  h.markOrderPaid.mockResolvedValue({ order: {} as DbOrder, transitioned: true });
});

describe('createManualOrderAction', () => {
  it('writes a manual order priced by the shared builder and marks it paid', async () => {
    const res = await createManualOrderAction(input());

    expect(res).toEqual({ orderId: 'order-new' });

    const written = h.setSpy.mock.calls[0][0] as unknown as DbOrder;
    expect(written).toMatchObject({
      source: 'manual',
      status: 'pending', // written pending, then flipped by markOrderPaid
      payment_status: 'pending',
      subtotal_centavos: 100000,
      total_centavos: 130000, // 100000 + 30000 shipping
      payment_session_id: null, // no checkout session for a manual order
    });

    // Stock decrement goes through the shared path, with a manual_ reference.
    expect(h.markOrderPaid).toHaveBeenCalledTimes(1);
    const [, tx, opts] = h.markOrderPaid.mock.calls[0] as unknown as [
      string,
      undefined,
      { paymentReference: string; actor: string },
    ];
    expect(tx).toBeUndefined();
    expect(opts.actor).toBe('admin');
    expect(opts.paymentReference).toMatch(/^manual_/);
  });

  it('leaves the order pending and does not touch stock when payment is not collected', async () => {
    const res = await createManualOrderAction(input({ markPaid: false }));

    expect(res).toEqual({ orderId: 'order-new' });
    expect(h.markOrderPaid).not.toHaveBeenCalled();
  });

  it('blanks the shipping region on pickup', async () => {
    await createManualOrderAction(input({ fulfillmentMethod: 'pickup', region: 'luzon' }));
    const written = h.setSpy.mock.calls[0][0] as unknown as DbOrder;
    expect(written.shipping_region).toBe('');
  });

  it('keeps the region on delivery', async () => {
    await createManualOrderAction(
      input({
        fulfillmentMethod: 'delivery',
        region: 'luzon',
        customer: {
          name: 'Juan',
          email: '',
          phone: '09171234567',
          address: '123 Rizal St',
        },
      }),
    );
    const written = h.setSpy.mock.calls[0][0] as unknown as DbOrder;
    expect(written.shipping_region).toBe('luzon');
  });

  it('requires a name and a phone', async () => {
    expect(
      await createManualOrderAction(
        input({ customer: { name: '  ', email: '', phone: '0917', address: null } }),
      ),
    ).toEqual({ error: 'Customer name is required.' });

    expect(
      await createManualOrderAction(
        input({ customer: { name: 'Juan', email: '', phone: '', address: null } }),
      ),
    ).toEqual({ error: 'Customer phone is required.' });

    expect(h.setSpy).not.toHaveBeenCalled();
  });

  it('requires an address and region for delivery', async () => {
    const res = await createManualOrderAction(input({ fulfillmentMethod: 'delivery' }));
    expect(res).toEqual({ error: 'A delivery address is required.' });
    expect(h.setSpy).not.toHaveBeenCalled();
  });

  it('propagates a pricing/stock rejection without writing anything', async () => {
    h.buildOrderLines.mockResolvedValueOnce({ ok: false, error: 'Only 1 left.' });

    const res = await createManualOrderAction(input());

    expect(res).toEqual({ error: 'Only 1 left.' });
    expect(h.setSpy).not.toHaveBeenCalled();
    expect(h.markOrderPaid).not.toHaveBeenCalled();
  });

  it('emails the paid receipt only when asked AND an email exists', async () => {
    await createManualOrderAction(
      input({
        notifyCustomer: true,
        customer: { name: 'Juan', email: 'juan@example.com', phone: '0917', address: null },
      }),
    );
    expect(h.notifyOrderPaid).toHaveBeenCalledWith('order-new');
    expect(h.notifyOrderReceived).not.toHaveBeenCalled();
  });

  it('sends the received ack instead when the order is not yet paid', async () => {
    await createManualOrderAction(
      input({
        markPaid: false,
        notifyCustomer: true,
        customer: { name: 'Juan', email: 'juan@example.com', phone: '0917', address: null },
      }),
    );
    expect(h.notifyOrderReceived).toHaveBeenCalledWith('order-new');
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
  });

  it('sends nothing when there is no email address (walk-in)', async () => {
    await createManualOrderAction(input({ notifyCustomer: true })); // email is ''
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
    expect(h.notifyOrderReceived).not.toHaveBeenCalled();
  });

  it('enforces admin auth before doing anything', async () => {
    h.requireAdminAuth.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(createManualOrderAction(input())).rejects.toThrow('Unauthorized');
    expect(h.buildOrderLines).not.toHaveBeenCalled();
    expect(h.setSpy).not.toHaveBeenCalled();
  });
});
