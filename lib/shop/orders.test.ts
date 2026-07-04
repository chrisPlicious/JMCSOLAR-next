import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder, DbOrderItem, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// --- Firebase Admin mock -----------------------------------------------------
// markOrderPaid (and the recordStockChange it calls) only ever touch adminDb via
// `collection(name).doc(id?)` to build DocumentReferences. We model refs as plain
// tagged objects so a fake transaction can read/write an in-memory doc store. No
// real Firestore is touched. This mirrors lib/shop/inventory.test.ts but with a
// richer store so the paid-path's reads-before-writes flow can be exercised.
const h = vi.hoisted(() => {
  // key = `${collection}/${id}` -> document data (undefined = does not exist)
  const docStore = new Map<string, Record<string, unknown> | undefined>();
  let auditSeq = 0;

  type Ref = { __col: string; __id: string; id: string; update: ReturnType<typeof vi.fn> };
  const makeRef = (col: string, id?: string): Ref => {
    const realId = id ?? `auto-${col}-${col === 'stockAudit' ? ++auditSeq : Math.random()}`;
    return { __col: col, __id: realId, id: realId, update: vi.fn() };
  };

  const collectionSpy = vi.fn((name: string) => ({
    doc: (id?: string) => makeRef(name, id),
    // abandonedCarts query chain (post-commit, no-tx path only)
    where: () => ({
      where: () => ({
        get: async () => ({ docs: [] as unknown[] }),
      }),
    }),
  }));

  const adminDb = {
    collection: collectionSpy,
    runTransaction: vi.fn(),
  };

  return { docStore, makeRef, adminDb, collectionSpy };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: h.adminDb }));

import { markOrderPaid } from './orders';

// --- Fake transaction --------------------------------------------------------
type Ref = { __col: string; __id: string; id: string };

function makeTx() {
  const get = vi.fn(async (ref: Ref) => {
    const data = h.docStore.get(`${ref.__col}/${ref.__id}`);
    return {
      exists: data !== undefined,
      id: ref.__id,
      data: () => data,
    };
  });
  const update = vi.fn();
  const set = vi.fn();
  return { get, update, set } as unknown as import('firebase-admin').firestore.Transaction & {
    get: typeof get;
    update: typeof update;
    set: typeof set;
  };
}

// --- Fixtures ----------------------------------------------------------------
function seedOrder(id: string, items: DbOrderItem[], over: Partial<DbOrder> = {}) {
  const order: DbOrder = {
    id,
    items,
    subtotal_centavos: 0,
    shipping_centavos: 0,
    shipping_region: '',
    fulfillment_method: 'delivery',
    source: 'online',
    return_status: 'none',
    total_centavos: 0,
    customer: { name: 'Buyer', email: 'buyer@example.com', phone: '09171234567', address: 'Addr' },
    status: 'pending',
    payment_status: 'pending',
    payment_reference: null,
    payment_session_id: null,
    paid_at: null,
    refund_id: null,
    refunded_at: null,
    refund_amount: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: null,
    ...over,
  };
  const { id: _id, ...data } = order;
  h.docStore.set(`orders/${id}`, data);
  return order;
}

function line(over: Partial<DbOrderItem>): DbOrderItem {
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

function seedSimpleItem(id: string, stock: number, over: Partial<DbShopItem> = {}) {
  const item: Partial<DbShopItem> = {
    name: 'Item',
    slug: id,
    sku: `SKU-${id}`,
    price: 10_000,
    stock,
    variants: null,
    active: true,
    ...over,
  };
  h.docStore.set(`shopItems/${id}`, item as Record<string, unknown>);
}

function seedVariantItem(id: string, variants: DbShopItemVariant[]) {
  h.docStore.set(`shopItems/${id}`, {
    name: 'Item',
    slug: id,
    sku: `SKU-${id}`,
    price: 0,
    stock: 0,
    variants,
    active: true,
  } as Record<string, unknown>);
}

// Helpers to slice the recorded tx calls by the collection of their target ref.
const itemUpdates = (tx: ReturnType<typeof makeTx>) =>
  tx.update.mock.calls.filter((c) => (c[0] as Ref).__col === 'shopItems');
const orderUpdates = (tx: ReturnType<typeof makeTx>) =>
  tx.update.mock.calls.filter((c) => (c[0] as Ref).__col === 'orders');
const auditSets = (tx: ReturnType<typeof makeTx>) =>
  tx.set.mock.calls.filter((c) => (c[0] as Ref).__col === 'stockAudit');

beforeEach(() => {
  vi.clearAllMocks();
  h.docStore.clear();
});

describe('markOrderPaid — simple item', () => {
  it('decrements stock by quantity, marks the order paid, and records one sale audit row', async () => {
    seedSimpleItem('item-1', 10);
    seedOrder('order-1', [line({ shop_item_id: 'item-1', quantity: 3 })]);
    const tx = makeTx();

    const result = await markOrderPaid('order-1', tx);

    // order marked paid (and this call performed the transition)
    expect(result?.transitioned).toBe(true);
    expect(result?.order.payment_status).toBe('paid');
    expect(result?.order.status).toBe('paid');
    expect(result?.order.paid_at).toEqual(expect.any(String));

    const ou = orderUpdates(tx);
    expect(ou).toHaveLength(1);
    expect(ou[0][1]).toMatchObject({ status: 'paid', payment_status: 'paid' });
    expect((ou[0][1] as Record<string, unknown>).paid_at).toEqual(expect.any(String));

    // stock decremented 10 -> 7
    const iu = itemUpdates(tx);
    expect(iu).toHaveLength(1);
    expect(iu[0][1]).toMatchObject({ stock: 7 });

    // one stockAudit row, reason 'sale', truthful delta + stock_after
    const audits = auditSets(tx);
    expect(audits).toHaveLength(1);
    expect(audits[0][1]).toMatchObject({
      shop_item_id: 'item-1',
      variant_id: null,
      delta: -3,
      reason: 'sale',
      ref_id: 'order-1',
      stock_after: 7,
    });
  });
});

describe('markOrderPaid — variant item', () => {
  it("decrements only the purchased variant's stock and leaves siblings untouched", async () => {
    seedVariantItem('item-1', [
      { id: 'v1', label: 'A', sku: 'A', price_centavos: 5_000, stock: 10 },
      { id: 'v2', label: 'B', sku: 'B', price_centavos: 6_000, stock: 7 },
    ]);
    seedOrder('order-1', [line({ shop_item_id: 'item-1', variant_id: 'v2', quantity: 3 })]);
    const tx = makeTx();

    await markOrderPaid('order-1', tx);

    const iu = itemUpdates(tx);
    expect(iu).toHaveLength(1);
    const variants = (iu[0][1] as { variants: DbShopItemVariant[] }).variants;
    expect(variants.find((v) => v.id === 'v1')?.stock).toBe(10); // untouched
    expect(variants.find((v) => v.id === 'v2')?.stock).toBe(4); // 7 - 3

    const audits = auditSets(tx);
    expect(audits).toHaveLength(1);
    expect(audits[0][1]).toMatchObject({ variant_id: 'v2', delta: -3, stock_after: 4 });
  });
});

describe('markOrderPaid — idempotency', () => {
  it('does nothing for an already-paid order and returns it unchanged', async () => {
    seedSimpleItem('item-1', 10);
    const paid = seedOrder('order-1', [line({ shop_item_id: 'item-1', quantity: 3 })], {
      payment_status: 'paid',
      status: 'paid',
      paid_at: '2026-01-02T00:00:00.000Z',
    });
    const tx = makeTx();

    const result = await markOrderPaid('order-1', tx);

    expect(orderUpdates(tx)).toHaveLength(0);
    expect(itemUpdates(tx)).toHaveLength(0);
    expect(auditSets(tx)).toHaveLength(0);
    expect(result?.transitioned).toBe(false);
    expect(result?.order.paid_at).toBe(paid.paid_at);
  });
});

describe('markOrderPaid — missing order', () => {
  it('returns null when the order does not exist', async () => {
    const tx = makeTx();
    const result = await markOrderPaid('does-not-exist', tx);
    expect(result).toBeNull();
    expect(orderUpdates(tx)).toHaveLength(0);
  });
});

describe('markOrderPaid — insufficient stock', () => {
  it('clamps stock to 0 without throwing, still marks paid, and audits the clamped delta', async () => {
    seedSimpleItem('item-1', 1); // only 1 in stock
    seedOrder('order-1', [line({ shop_item_id: 'item-1', quantity: 5 })]);
    const tx = makeTx();

    const result = await markOrderPaid('order-1', tx); // must not throw

    expect(result?.order.payment_status).toBe('paid');

    const iu = itemUpdates(tx);
    expect(iu[0][1]).toMatchObject({ stock: 0 });

    const audits = auditSets(tx);
    expect(audits).toHaveLength(1);
    // delta is the actual movement (1 -> 0 = -1), not the requested -5; stock_after truthful
    expect(audits[0][1]).toMatchObject({ delta: -1, stock_after: 0 });
  });
});

describe('markOrderPaid — multiple lines sharing one item', () => {
  it('combines the decrement and writes the item once', async () => {
    seedSimpleItem('item-1', 10);
    seedOrder('order-1', [
      line({ shop_item_id: 'item-1', quantity: 2 }),
      line({ shop_item_id: 'item-1', quantity: 3 }),
    ]);
    const tx = makeTx();

    await markOrderPaid('order-1', tx);

    const iu = itemUpdates(tx);
    expect(iu).toHaveLength(1); // single write for the shared item
    expect(iu[0][1]).toMatchObject({ stock: 5 }); // 10 - 2 - 3

    // one audit row per line (each captures its own movement + running stock_after)
    const audits = auditSets(tx);
    expect(audits).toHaveLength(2);
    const byNum = (a: number, b: number) => a - b;
    expect(audits.map((a) => (a[1] as { delta: number }).delta).sort(byNum)).toEqual([-3, -2]);
    expect(audits.map((a) => (a[1] as { stock_after: number }).stock_after).sort(byNum)).toEqual([5, 8]);
  });
});

describe('markOrderPaid — no transaction (opens its own)', () => {
  it('runs applyPaid inside adminDb.runTransaction and returns the paid order', async () => {
    seedSimpleItem('item-1', 10);
    seedOrder('order-1', [line({ shop_item_id: 'item-1', quantity: 2 })]);
    const tx = makeTx();
    h.adminDb.runTransaction.mockImplementation(
      (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await markOrderPaid('order-1');

    expect(h.adminDb.runTransaction).toHaveBeenCalledTimes(1);
    expect(result?.order.payment_status).toBe('paid');
    expect(itemUpdates(tx)[0][1]).toMatchObject({ stock: 8 });
  });
});
