import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder, DbOrderItem, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// --- Firebase Admin mock -----------------------------------------------------
// Mirrors lib/shop/orders.test.ts: refs are plain tagged objects over an in-memory
// doc store, and runTransaction hands the real implementation a fake transaction
// so the reads-before-writes flow is exercised without touching Firestore.
const h = vi.hoisted(() => {
  // key = `${collection}/${id}` -> document data (undefined = does not exist)
  const docStore = new Map<string, Record<string, unknown> | undefined>();
  let autoSeq = 0;

  type Ref = {
    __col: string;
    __id: string;
    id: string;
    update: ReturnType<typeof vi.fn>;
    get: () => Promise<{ exists: boolean; id: string; data: () => unknown }>;
  };
  const makeRef = (col: string, id?: string): Ref => {
    const realId = id ?? `auto-${col}-${++autoSeq}`;
    return {
      __col: col,
      __id: realId,
      id: realId,
      update: vi.fn(),
      // recordManualRefund validates OUTSIDE the transaction, so refs need a
      // direct .get() as well as the transactional one.
      get: async () => {
        const data = docStore.get(`${col}/${realId}`);
        return { exists: data !== undefined, id: realId, data: () => data };
      },
    };
  };

  // Query results for findOrderIdByPaymentId, keyed by field name.
  const queryResults = new Map<string, { id: string }[]>();

  const collectionSpy = vi.fn((name: string) => ({
    doc: (id?: string) => makeRef(name, id),
    where: (field: string, _op: string, _val: unknown) => ({
      limit: () => ({
        get: async () => {
          const docs = queryResults.get(field) ?? [];
          return { empty: docs.length === 0, docs };
        },
      }),
    }),
  }));

  const txGet = vi.fn();
  const txUpdate = vi.fn();
  const txSet = vi.fn();

  const runTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      get: vi.fn(async (ref: { __col: string; __id: string }) => {
        const data = docStore.get(`${ref.__col}/${ref.__id}`);
        txGet(`${ref.__col}/${ref.__id}`);
        return { exists: data !== undefined, id: ref.__id, data: () => data };
      }),
      update: vi.fn((ref: { __col: string; __id: string }, patch: Record<string, unknown>) => {
        txUpdate(`${ref.__col}/${ref.__id}`, patch);
      }),
      set: vi.fn((ref: { __col: string; __id: string }, doc: Record<string, unknown>) => {
        txSet(`${ref.__col}/${ref.__id}`, doc);
      }),
    };
    return fn(tx);
  });

  const adminDb = { collection: collectionSpy, runTransaction };

  return { docStore, adminDb, collectionSpy, txGet, txUpdate, txSet, queryResults };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: h.adminDb }));

import { applyRefundToOrder, recordManualRefund, findOrderIdByPaymentId } from './refunds';

// --- Fixtures ----------------------------------------------------------------
function line(over: Partial<DbOrderItem>): DbOrderItem {
  return {
    shop_item_id: 'item-1',
    variant_id: null,
    name: 'Solar Flood Light',
    sku: 'SFL-01',
    unit_price_centavos: 50000,
    quantity: 1,
    line_total_centavos: 50000,
    ...over,
  };
}

function seedOrder(id: string, items: DbOrderItem[], over: Partial<DbOrder> = {}) {
  const order: DbOrder = {
    id,
    items,
    subtotal_centavos: 50000,
    shipping_centavos: 0,
    shipping_region: '',
    fulfillment_method: 'pickup',
    source: 'online',
    return_status: 'none',
    total_centavos: 50000,
    customer: { name: 'Buyer', email: 'buyer@example.com', phone: '09171234567', address: null },
    status: 'paid',
    payment_status: 'paid',
    payment_reference: 'pay_abc',
    payment_session_id: 'cs_abc',
    paid_at: '2026-01-02T00:00:00.000Z',
    refund_id: null,
    refunded_at: null,
    refund_amount: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: null,
    ...over,
  };
  const { id: _id, ...data } = order;
  h.docStore.set(`orders/${id}`, data);
}

function seedItem(id: string, stock: number, variants: DbShopItemVariant[] | null = null) {
  const item: Omit<DbShopItem, 'id'> = {
    name: 'Solar Flood Light',
    slug: 'solar-flood-light',
    description: 'x',
    category: 'lights',
    sku: 'SFL-01',
    price: 50000,
    stock,
    low_stock_threshold: null,
    active: true,
    weight_grams: null,
    image_path: null,
    variants,
    meta_title: null,
    meta_description: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
  h.docStore.set(`shopItems/${id}`, item as unknown as Record<string, unknown>);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.docStore.clear();
  h.queryResults.clear();
});

describe('applyRefundToOrder', () => {
  it('restores base stock, flags the order refunded, and writes a refund_restore audit', async () => {
    seedOrder('order-1', [line({ quantity: 3 })]);
    seedItem('item-1', 7);

    const result = await applyRefundToOrder({
      orderId: 'order-1',
      refundId: 'ref_123',
      refundAmount: 50000,
      actor: 'webhook',
      method: 'provider',
    });

    expect(result).toBe('refunded');

    const orderPatch = h.txUpdate.mock.calls.find((c) => c[0] === 'orders/order-1')?.[1];
    expect(orderPatch).toMatchObject({
      payment_status: 'refunded',
      status: 'cancelled',
      refund_id: 'ref_123',
      refund_amount: 50000,
      refund_method: 'provider',
    });

    // 7 in stock + 3 refunded back = 10
    const itemPatch = h.txUpdate.mock.calls.find((c) => c[0] === 'shopItems/item-1')?.[1];
    expect(itemPatch).toMatchObject({ stock: 10 });

    const audit = h.txSet.mock.calls.find((c) => String(c[0]).startsWith('stockAudit/'))?.[1];
    expect(audit).toMatchObject({
      shop_item_id: 'item-1',
      delta: 3,
      reason: 'refund_restore',
      ref_id: 'order-1',
      actor: 'webhook',
      stock_after: 10,
    });
  });

  it('restores per-variant stock and leaves other variants untouched', async () => {
    seedOrder('order-1', [line({ variant_id: 'v-100w', quantity: 2 })]);
    seedItem('item-1', 0, [
      { id: 'v-100w', label: '100W', sku: 'A', price_centavos: 50000, stock: 1 },
      { id: 'v-200w', label: '200W', sku: 'B', price_centavos: 90000, stock: 5 },
    ]);

    const result = await applyRefundToOrder({
      orderId: 'order-1',
      refundId: 'ref_123',
      refundAmount: 50000,
      actor: 'webhook',
      method: 'provider',
    });

    expect(result).toBe('refunded');
    const itemPatch = h.txUpdate.mock.calls.find((c) => c[0] === 'shopItems/item-1')?.[1] as {
      variants: DbShopItemVariant[];
    };
    expect(itemPatch.variants.find((v) => v.id === 'v-100w')?.stock).toBe(3); // 1 + 2
    expect(itemPatch.variants.find((v) => v.id === 'v-200w')?.stock).toBe(5); // untouched
  });

  it('is a no-op when the order is already refunded (no double restore)', async () => {
    seedOrder('order-1', [line({ quantity: 3 })], { payment_status: 'refunded' });
    seedItem('item-1', 7);

    const result = await applyRefundToOrder({
      orderId: 'order-1',
      refundId: 'ref_123',
      refundAmount: 50000,
      actor: 'webhook',
      method: 'provider',
    });

    expect(result).toBe('duplicate');
    expect(h.txUpdate).not.toHaveBeenCalled();
    expect(h.txSet).not.toHaveBeenCalled();
  });

  it('returns missing when the order does not exist', async () => {
    const result = await applyRefundToOrder({
      orderId: 'nope',
      refundId: null,
      refundAmount: 1,
      actor: 'admin',
      method: 'manual',
    });

    expect(result).toBe('missing');
    expect(h.txUpdate).not.toHaveBeenCalled();
  });

  it('short-circuits on a replayed webhook event before reading the order', async () => {
    seedOrder('order-1', [line({ quantity: 3 })]);
    seedItem('item-1', 7);
    h.docStore.set('processedWebhookEvents/evt_1', { id: 'evt_1' });

    const result = await applyRefundToOrder({
      orderId: 'order-1',
      refundId: 'ref_123',
      refundAmount: 50000,
      actor: 'webhook',
      method: 'provider',
      eventClaim: { eventId: 'evt_1', eventType: 'refund.succeeded' },
    });

    expect(result).toBe('duplicate');
    expect(h.txUpdate).not.toHaveBeenCalled();
    expect(h.txGet).not.toHaveBeenCalledWith('orders/order-1');
  });

  it('claims the webhook event in the same transaction as the refund', async () => {
    seedOrder('order-1', [line({ quantity: 1 })]);
    seedItem('item-1', 0);

    await applyRefundToOrder({
      orderId: 'order-1',
      refundId: 'ref_123',
      refundAmount: 50000,
      actor: 'webhook',
      method: 'provider',
      eventClaim: {
        eventId: 'evt_2',
        eventType: 'refund.succeeded',
        extra: { payment_id: 'pay_abc' },
      },
    });

    const claim = h.txSet.mock.calls.find((c) => c[0] === 'processedWebhookEvents/evt_2')?.[1];
    expect(claim).toMatchObject({
      id: 'evt_2',
      type: 'refund.succeeded',
      order_id: 'order-1',
      payment_id: 'pay_abc',
    });
  });

  it('skips a deleted shop item without aborting the refund', async () => {
    seedOrder('order-1', [line({ quantity: 3 })]); // item-1 never seeded

    const result = await applyRefundToOrder({
      orderId: 'order-1',
      refundId: null,
      refundAmount: 50000,
      actor: 'admin',
      method: 'manual',
    });

    expect(result).toBe('refunded');
    expect(h.txUpdate.mock.calls.find((c) => c[0] === 'orders/order-1')).toBeTruthy();
    expect(h.txSet.mock.calls.filter((c) => String(c[0]).startsWith('stockAudit/'))).toHaveLength(0);
  });
});

describe('recordManualRefund', () => {
  it('records a full-total manual refund with the admin actor and note', async () => {
    seedOrder('order-1', [line({ quantity: 2 })]);
    seedItem('item-1', 4);

    const result = await recordManualRefund({
      orderId: 'order-1',
      note: 'BPI transfer ref 998877',
      actor: 'admin',
    });

    expect(result).toEqual({ ok: true, amountCentavos: 50000 });
    const patch = h.txUpdate.mock.calls.find((c) => c[0] === 'orders/order-1')?.[1];
    expect(patch).toMatchObject({
      payment_status: 'refunded',
      refund_id: null, // no provider refund exists under QRPh
      refund_method: 'manual',
      refund_note: 'BPI transfer ref 998877',
      refund_actor: 'admin',
    });
  });

  it('accepts a partial amount within the order total', async () => {
    seedOrder('order-1', [line({ quantity: 1 })]);
    seedItem('item-1', 0);

    const result = await recordManualRefund({
      orderId: 'order-1',
      amountCentavos: 20000,
      actor: 'admin',
    });

    expect(result).toEqual({ ok: true, amountCentavos: 20000 });
  });

  it('rejects an amount above the order total', async () => {
    seedOrder('order-1', [line({})]);

    const result = await recordManualRefund({
      orderId: 'order-1',
      amountCentavos: 999999,
      actor: 'admin',
    });

    expect(result).toEqual({ ok: false, error: 'Refund amount exceeds the order total.' });
    expect(h.txUpdate).not.toHaveBeenCalled();
  });

  it('rejects a zero or negative amount', async () => {
    seedOrder('order-1', [line({})]);

    expect(await recordManualRefund({ orderId: 'order-1', amountCentavos: 0, actor: 'admin' })).toEqual({
      ok: false,
      error: 'Refund amount must be a positive whole number of centavos.',
    });
    expect(h.txUpdate).not.toHaveBeenCalled();
  });

  it('refuses an unpaid order', async () => {
    seedOrder('order-1', [line({})], { payment_status: 'pending' });

    const result = await recordManualRefund({ orderId: 'order-1', actor: 'admin' });
    expect(result).toEqual({ ok: false, error: 'Only a paid order can be refunded.' });
  });

  it('refuses an already-refunded order', async () => {
    seedOrder('order-1', [line({})], { payment_status: 'refunded' });

    const result = await recordManualRefund({ orderId: 'order-1', actor: 'admin' });
    expect(result).toEqual({ ok: false, error: 'This order is already refunded.' });
  });

  it('errors on a missing order', async () => {
    const result = await recordManualRefund({ orderId: 'gone', actor: 'admin' });
    expect(result).toEqual({ ok: false, error: 'Order not found.' });
  });
});

describe('findOrderIdByPaymentId', () => {
  it('matches on payment_reference first', async () => {
    h.queryResults.set('payment_reference', [{ id: 'order-1' }]);
    await expect(findOrderIdByPaymentId('pay_abc')).resolves.toBe('order-1');
  });

  it('falls back to payment_session_id', async () => {
    h.queryResults.set('payment_session_id', [{ id: 'order-2' }]);
    await expect(findOrderIdByPaymentId('cs_abc')).resolves.toBe('order-2');
  });

  it('returns null when nothing matches', async () => {
    await expect(findOrderIdByPaymentId('pay_unknown')).resolves.toBeNull();
  });

  it('returns null for an empty payment id without querying', async () => {
    await expect(findOrderIdByPaymentId('')).resolves.toBeNull();
    expect(h.collectionSpy).not.toHaveBeenCalled();
  });
});
