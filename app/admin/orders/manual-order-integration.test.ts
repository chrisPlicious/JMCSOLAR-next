import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// Integration-level companion to manual-order-action.test.ts.
//
// That file mocks buildOrderLines and markOrderPaid, so it proves the action CALLS
// them — not that the composition produces correct money and stock. Here the REAL
// order-lines, orders (markOrderPaid) and inventory (recordStockChange) modules run
// against an in-memory Firestore, so a pricing or stock-decrement regression in any
// of them fails this test.
//
// Only the edges are mocked: auth, next/cache, and email.
const h = vi.hoisted(() => {
  // key = `${collection}/${id}` -> document data (undefined = does not exist)
  const docStore = new Map<string, Record<string, unknown> | undefined>();
  let autoSeq = 0;

  type Ref = {
    __col: string;
    __id: string;
    id: string;
    get: () => Promise<{ exists: boolean; id: string; data: () => unknown }>;
    set: (d: Record<string, unknown>) => Promise<void>;
    update: (p: Record<string, unknown>) => Promise<void>;
  };

  const makeRef = (col: string, id?: string): Ref => {
    const realId = id ?? `auto-${col}-${++autoSeq}`;
    const key = `${col}/${realId}`;
    return {
      __col: col,
      __id: realId,
      id: realId,
      get: async () => {
        const data = docStore.get(key);
        return { exists: data !== undefined, id: realId, data: () => data };
      },
      set: async (d) => {
        docStore.set(key, d);
      },
      update: async (p) => {
        docStore.set(key, { ...(docStore.get(key) ?? {}), ...p });
      },
    };
  };

  const collection = (name: string) => ({
    doc: (id?: string) => makeRef(name, id),
    // abandonedCarts recovery chain used by markOrderPaid's post-commit step
    where: () => ({ where: () => ({ get: async () => ({ docs: [] as unknown[] }) }) }),
  });

  const runTransaction = async (fn: (tx: unknown) => Promise<unknown>) => {
    // Writes are staged then applied on commit, so a mid-transaction throw leaves
    // the store untouched — same guarantee the real API gives.
    const staged: { key: string; patch: Record<string, unknown>; mode: 'set' | 'update' }[] = [];
    const tx = {
      get: async (ref: Ref) => {
        const data = docStore.get(`${ref.__col}/${ref.__id}`);
        return { exists: data !== undefined, id: ref.__id, data: () => data };
      },
      set: (ref: Ref, doc: Record<string, unknown>) => {
        staged.push({ key: `${ref.__col}/${ref.__id}`, patch: doc, mode: 'set' });
      },
      update: (ref: Ref, patch: Record<string, unknown>) => {
        staged.push({ key: `${ref.__col}/${ref.__id}`, patch, mode: 'update' });
      },
    };
    const result = await fn(tx);
    for (const w of staged) {
      docStore.set(
        w.key,
        w.mode === 'set' ? w.patch : { ...(docStore.get(w.key) ?? {}), ...w.patch },
      );
    }
    return result;
  };

  return {
    docStore,
    adminDb: { collection, runTransaction },
    requireAdminAuth: vi.fn(async () => undefined),
    revalidatePath: vi.fn(),
  };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: h.adminDb }));
vi.mock('@/lib/auth', () => ({ requireAdminAuth: h.requireAdminAuth }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/lib/shop/notifications', () => ({
  notifyOrderPaid: vi.fn(async () => undefined),
  notifyOrderReceived: vi.fn(async () => undefined),
  notifyOrderRefunded: vi.fn(async () => undefined),
}));

import { createManualOrderAction, type ManualOrderInput } from './actions';

function seedItem(
  id: string,
  over: Partial<DbShopItem> & { variants?: DbShopItemVariant[] | null } = {},
) {
  const item: Omit<DbShopItem, 'id'> = {
    name: 'Solar Flood Light',
    slug: 'solar-flood-light',
    description: 'x',
    category: 'lights',
    sku: 'SFL-01',
    price: 50000, // ₱500
    stock: 10,
    low_stock_threshold: null,
    active: true,
    weight_grams: null,
    image_path: null,
    variants: null,
    meta_title: null,
    meta_description: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...over,
  };
  h.docStore.set(`shopItems/${id}`, item as unknown as Record<string, unknown>);
}

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

function storedOrders(): DbOrder[] {
  return [...h.docStore.entries()]
    .filter(([k]) => k.startsWith('orders/'))
    .map(([k, v]) => ({ id: k.slice('orders/'.length), ...(v as object) }) as DbOrder);
}

function storedAudits(): Record<string, unknown>[] {
  return [...h.docStore.entries()]
    .filter(([k]) => k.startsWith('stockAudit/'))
    .map(([, v]) => v as Record<string, unknown>);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.docStore.clear();
});

describe('createManualOrderAction — real pricing + real stock decrement', () => {
  it('computes money from the catalogue and decrements stock exactly once', async () => {
    seedItem('item-1', { price: 50000, stock: 10 });

    const res = await createManualOrderAction(input()); // qty 2, pickup
    expect('orderId' in res).toBe(true);

    const order = storedOrders()[0];
    expect(order.subtotal_centavos).toBe(100000); // 2 × ₱500, from Firestore
    expect(order.shipping_centavos).toBe(0); // pickup
    expect(order.total_centavos).toBe(100000);
    expect(order.payment_status).toBe('paid');
    expect(order.status).toBe('paid');
    expect(order.source).toBe('manual');
    expect(order.payment_reference).toMatch(/^manual_/);

    // Real stock decrement: 10 - 2 = 8
    const item = h.docStore.get('shopItems/item-1') as DbShopItem;
    expect(item.stock).toBe(8);

    const audits = storedAudits();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      shop_item_id: 'item-1',
      delta: -2,
      reason: 'sale',
      actor: 'admin',
      stock_after: 8,
    });
  });

  it('adds the real region shipping fee on a delivery order', async () => {
    seedItem('item-1', { price: 50000, stock: 10 });

    await createManualOrderAction(
      input({
        fulfillmentMethod: 'delivery',
        region: 'ormoc_city', // ₱300 in lib/shop/shipping.ts
        customer: { name: 'Juan', email: '', phone: '0917', address: '123 Rizal St' },
        lines: [{ shopItemId: 'item-1', variantId: null, quantity: 1 }],
      }),
    );

    const order = storedOrders()[0];
    expect(order.subtotal_centavos).toBe(50000);
    expect(order.shipping_centavos).toBe(30000);
    expect(order.total_centavos).toBe(80000);
  });

  it('prices and decrements the chosen variant, not the base item', async () => {
    seedItem('item-1', {
      price: 50000,
      stock: 99,
      variants: [
        { id: 'v-100w', label: '100W', sku: 'A', price_centavos: 60000, stock: 5 },
        { id: 'v-200w', label: '200W', sku: 'B', price_centavos: 90000, stock: 7 },
      ],
    });

    await createManualOrderAction(
      input({ lines: [{ shopItemId: 'item-1', variantId: 'v-200w', quantity: 3 }] }),
    );

    const order = storedOrders()[0];
    expect(order.total_centavos).toBe(270000); // 3 × ₱900, the variant price
    expect(order.items[0].name).toBe('Solar Flood Light — 200W');
    expect(order.items[0].sku).toBe('B');

    const item = h.docStore.get('shopItems/item-1') as DbShopItem;
    expect(item.variants?.find((v) => v.id === 'v-200w')?.stock).toBe(4); // 7 - 3
    expect(item.variants?.find((v) => v.id === 'v-100w')?.stock).toBe(5); // untouched
    expect(item.stock).toBe(99); // base stock untouched
  });

  it('leaves stock alone when payment was not collected', async () => {
    seedItem('item-1', { stock: 10 });

    await createManualOrderAction(input({ markPaid: false }));

    const item = h.docStore.get('shopItems/item-1') as DbShopItem;
    expect(item.stock).toBe(10);
    expect(storedAudits()).toHaveLength(0);
    expect(storedOrders()[0].payment_status).toBe('pending');
  });

  it('rejects a client that asks for more than the real stock, writing nothing', async () => {
    // This is the bypass case: the browser form disables the button, but the action
    // is a public endpoint and must refuse on its own.
    seedItem('item-1', { stock: 2 });

    const res = await createManualOrderAction(
      input({ lines: [{ shopItemId: 'item-1', variantId: null, quantity: 5 }] }),
    );

    expect(res).toEqual({ error: 'Not enough stock for "Solar Flood Light". Only 2 left.' });
    expect(storedOrders()).toHaveLength(0);
    expect(storedAudits()).toHaveLength(0);
    expect((h.docStore.get('shopItems/item-1') as DbShopItem).stock).toBe(2);
  });

  it('refuses an inactive item even though the form would not offer it', async () => {
    seedItem('item-1', { active: false });

    const res = await createManualOrderAction(input());

    expect('error' in res && res.error).toContain('no longer available');
    expect(storedOrders()).toHaveLength(0);
  });

  it('charges catalogue price regardless of quantity split across lines', async () => {
    seedItem('item-1', { price: 50000, stock: 10 });

    await createManualOrderAction(
      input({
        lines: [
          { shopItemId: 'item-1', variantId: null, quantity: 1 },
          { shopItemId: 'item-1', variantId: null, quantity: 2 },
        ],
      }),
    );

    const order = storedOrders()[0];
    expect(order.total_centavos).toBe(150000); // 3 × ₱500

    // Same item on two lines must still land as a single correct decrement.
    const item = h.docStore.get('shopItems/item-1') as DbShopItem;
    expect(item.stock).toBe(7); // 10 - 3
  });
});
