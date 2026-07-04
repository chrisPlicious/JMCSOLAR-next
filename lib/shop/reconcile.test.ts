import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder, DbOrderItem, DbShopItem } from '@/lib/firebase/types';

// --- Firebase Admin mock -----------------------------------------------------
// reconcileOrderPayment reads the order (non-tx), then delegates the paid flip to
// markOrderPaid (which opens its OWN runTransaction + recordStockChange). We back
// every ref with a shared in-memory docStore so the post-flip re-read actually
// reflects the paid status and decremented stock. No real Firestore is touched.
const h = vi.hoisted(() => {
  const docStore = new Map<string, Record<string, unknown> | undefined>();
  let auditSeq = 0;

  type Ref = {
    __col: string;
    __id: string;
    id: string;
    get: () => Promise<{ exists: boolean; id: string; data: () => unknown }>;
    update: (patch: Record<string, unknown>) => Promise<void>;
    set: (val: Record<string, unknown>) => Promise<void>;
  };

  const makeRef = (col: string, id?: string): Ref => {
    const realId = id ?? `auto-${col}-${col === 'stockAudit' ? ++auditSeq : Math.random()}`;
    const key = `${col}/${realId}`;
    return {
      __col: col,
      __id: realId,
      id: realId,
      get: async () => ({ exists: docStore.get(key) !== undefined, id: realId, data: () => docStore.get(key) }),
      update: async (patch: Record<string, unknown>) => {
        docStore.set(key, { ...(docStore.get(key) ?? {}), ...patch });
      },
      set: async (val: Record<string, unknown>) => {
        docStore.set(key, val);
      },
    };
  };

  const queryStub = {
    where: () => queryStub,
    limit: () => queryStub,
    get: async () => ({ empty: true, docs: [] as unknown[] }),
  };

  const collectionSpy = vi.fn((name: string) => ({
    doc: (id?: string) => makeRef(name, id),
    where: () => queryStub,
  }));

  const runTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      get: (ref: Ref) => ref.get(),
      update: (ref: Ref, patch: Record<string, unknown>) => ref.update(patch),
      set: (ref: Ref, val: Record<string, unknown>) => ref.set(val),
    };
    return fn(tx);
  });

  const adminDb = { collection: collectionSpy, runTransaction };

  const getStatus = vi.fn();
  const notifyOrderPaid = vi.fn(async () => undefined);

  return { docStore, adminDb, collectionSpy, runTransaction, getStatus, notifyOrderPaid };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: h.adminDb }));
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ getCheckoutSessionStatus: h.getStatus }),
}));
vi.mock('@/lib/shop/notifications', () => ({ notifyOrderPaid: h.notifyOrderPaid }));

import { reconcileOrderPayment } from './orders';

// --- Fixtures ----------------------------------------------------------------
function line(over: Partial<DbOrderItem> = {}): DbOrderItem {
  return {
    shop_item_id: 'item-1',
    variant_id: null,
    name: 'Item',
    sku: 'SKU-1',
    unit_price_centavos: 10_000,
    quantity: 1,
    line_total_centavos: 10_000,
    ...over,
  };
}

function seedOrder(id: string, over: Partial<DbOrder> = {}) {
  const order: DbOrder = {
    id,
    items: [line({ shop_item_id: 'item-1', quantity: 2 })],
    subtotal_centavos: 20_000,
    shipping_centavos: 0,
    shipping_region: '',
    fulfillment_method: 'delivery',
    source: 'online',
    return_status: 'none',
    total_centavos: 20_000,
    customer: { name: 'Buyer', email: 'buyer@example.com', phone: '09171234567', address: 'Addr' },
    status: 'pending',
    payment_status: 'pending',
    payment_reference: null,
    payment_session_id: 'cs_test_1',
    paid_at: null,
    refund_id: null,
    refunded_at: null,
    refund_amount: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: null,
    ...over,
  };
  const { id: _id, ...data } = order;
  h.docStore.set(`orders/${id}`, data as Record<string, unknown>);
  return order;
}

function seedItem(id: string, stock: number) {
  h.docStore.set(`shopItems/${id}`, {
    name: 'Item',
    slug: id,
    sku: `SKU-${id}`,
    price: 10_000,
    stock,
    variants: null,
    active: true,
  } as Record<string, unknown>);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.docStore.clear();
});

describe('reconcileOrderPayment', () => {
  it('flips a pending order to paid, decrements stock, and fires notifyOrderPaid once when the session reports paid', async () => {
    seedItem('item-1', 10);
    seedOrder('order-1');
    h.getStatus.mockResolvedValue({ paid: true, paymentId: 'pay_real_123' });

    const result = await reconcileOrderPayment('order-1');

    expect(h.getStatus).toHaveBeenCalledWith('cs_test_1');
    expect(result?.payment_status).toBe('paid');
    expect(result?.status).toBe('paid');
    expect(result?.payment_reference).toBe('pay_real_123');
    // stock decremented 10 -> 8 in the shared store
    expect((h.docStore.get('shopItems/item-1') as { stock: number }).stock).toBe(8);
    expect(h.notifyOrderPaid).toHaveBeenCalledTimes(1);
    expect(h.notifyOrderPaid).toHaveBeenCalledWith('order-1');
  });

  it('leaves a pending order untouched and sends no email when the session is not paid', async () => {
    seedItem('item-1', 10);
    seedOrder('order-1');
    h.getStatus.mockResolvedValue({ paid: false, paymentId: null });

    const result = await reconcileOrderPayment('order-1');

    expect(result?.payment_status).toBe('pending');
    expect((h.docStore.get('shopItems/item-1') as { stock: number }).stock).toBe(10);
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
  });

  it('is a no-op for an already-paid order: no provider call, no email, no second decrement', async () => {
    seedItem('item-1', 8);
    seedOrder('order-1', { payment_status: 'paid', status: 'paid', paid_at: '2026-01-02T00:00:00.000Z' });

    const result = await reconcileOrderPayment('order-1');

    expect(result?.payment_status).toBe('paid');
    expect(h.getStatus).not.toHaveBeenCalled();
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
    expect((h.docStore.get('shopItems/item-1') as { stock: number }).stock).toBe(8);
  });

  it('returns null when the order does not exist', async () => {
    const result = await reconcileOrderPayment('missing');
    expect(result).toBeNull();
    expect(h.getStatus).not.toHaveBeenCalled();
  });

  it('returns the order unchanged without calling the provider when there is no payment_session_id', async () => {
    seedOrder('order-1', { payment_session_id: null });

    const result = await reconcileOrderPayment('order-1');

    expect(result?.payment_status).toBe('pending');
    expect(h.getStatus).not.toHaveBeenCalled();
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
  });

  it('does NOT throw when the provider throws, returning the originally-loaded order', async () => {
    seedItem('item-1', 10);
    seedOrder('order-1');
    h.getStatus.mockRejectedValue(new Error('paymongo down'));

    const result = await reconcileOrderPayment('order-1');

    expect(result?.id).toBe('order-1');
    expect(result?.payment_status).toBe('pending');
    expect(h.notifyOrderPaid).not.toHaveBeenCalled();
    expect((h.docStore.get('shopItems/item-1') as { stock: number }).stock).toBe(10);
  });
});
