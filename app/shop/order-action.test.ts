import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrder, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';
import { getShippingFee } from '@/lib/shop/shipping';

// --- Mocks -------------------------------------------------------------------
// createOrderAction is server-authoritative: the only client-trusted inputs are
// shopItemId / variantId / quantity. We mock Firestore (adminDb), the payment
// provider, next/headers and the notification helpers so the action runs with no
// network/IO and we can assert exactly what order doc it writes.
const h = vi.hoisted(() => {
  // shopItems the server will read; keyed by id.
  const shopItems = new Map<string, Partial<DbShopItem>>();

  const ordersSetSpy = vi.fn(async (..._a: unknown[]) => undefined);
  const ordersUpdateSpy = vi.fn(async (..._a: unknown[]) => undefined);
  const ordersRef = { id: 'order-123', set: ordersSetSpy, update: ordersUpdateSpy };
  const cartSetSpy = vi.fn(async (..._a: unknown[]) => undefined);

  const collectionSpy = vi.fn((name: string) => {
    if (name === 'shopItems') {
      return {
        doc: (id: string) => ({
          get: async () => {
            const data = shopItems.get(id);
            return { exists: data !== undefined, id, data: () => data };
          },
        }),
      };
    }
    if (name === 'orders') {
      return { doc: () => ordersRef };
    }
    if (name === 'abandonedCarts') {
      return { doc: () => ({ set: cartSetSpy }) };
    }
    throw new Error(`unexpected collection ${name}`);
  });

  const createCheckoutSession = vi.fn(async () => ({
    sessionId: 'sess_stub_1',
    checkoutUrl: '/pay/stub/order-123',
  }));

  return { shopItems, ordersSetSpy, ordersUpdateSpy, cartSetSpy, collectionSpy, createCheckoutSession };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: { collection: h.collectionSpy } }));
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ createCheckoutSession: h.createCheckoutSession }),
}));
vi.mock('@/lib/shop/notifications', () => ({
  notifyOrderReceived: vi.fn(async () => undefined),
  notifyAdminNewOrder: vi.fn(async () => undefined),
  notifyOrderPaid: vi.fn(async () => undefined),
}));
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (k: string) => (k === 'origin' ? 'http://localhost:3000' : null),
  }),
}));

import { createOrderAction, type CreateOrderInput } from './actions';

// The order doc passed to ordersRef.set — only valid when the action wrote one.
function writtenOrder(): DbOrder {
  expect(h.ordersSetSpy).toHaveBeenCalledTimes(1);
  return (h.ordersSetSpy.mock.calls[0] as unknown[])[0] as DbOrder;
}

function simpleItem(id: string, price: number, stock: number, over: Partial<DbShopItem> = {}) {
  h.shopItems.set(id, {
    name: `Item ${id}`,
    slug: id,
    sku: `SKU-${id}`,
    price,
    stock,
    variants: null,
    active: true,
    ...over,
  });
}

function variantItem(id: string, variants: DbShopItemVariant[]) {
  h.shopItems.set(id, {
    name: `Item ${id}`,
    slug: id,
    sku: `SKU-${id}`,
    price: 0,
    stock: 0,
    variants,
    active: true,
  });
}

function baseInput(over: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    cartItems: [{ shopItemId: 'a', variantId: null, quantity: 2 }],
    customer: { name: 'Buyer', email: 'buyer@example.com', phone: '09171234567', address: '123 St' },
    region: 'ormoc_city',
    fulfillmentMethod: 'delivery',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.shopItems.clear();
});

describe('createOrderAction — server-authoritative pricing', () => {
  it('prices each line from the server shopItem doc, ignoring any client price', async () => {
    simpleItem('a', 49_900, 100); // server price ₱499.00
    const result = await createOrderAction(baseInput());

    expect('orderId' in result).toBe(true);
    const order = writtenOrder();
    expect(order.items[0].unit_price_centavos).toBe(49_900);
    expect(order.items[0].line_total_centavos).toBe(99_800); // 49900 * 2
    expect(order.subtotal_centavos).toBe(99_800);
  });

  it('uses the server variant price_centavos and label/sku for variant lines', async () => {
    variantItem('a', [
      { id: 'v1', label: 'Small', sku: 'A-S', price_centavos: 12_345, stock: 50 },
    ]);
    const result = await createOrderAction(
      baseInput({ cartItems: [{ shopItemId: 'a', variantId: 'v1', quantity: 3 }] }),
    );

    expect('orderId' in result).toBe(true);
    const order = writtenOrder();
    expect(order.items[0].unit_price_centavos).toBe(12_345);
    expect(order.items[0].sku).toBe('A-S');
    expect(order.items[0].name).toContain('Small');
    expect(order.items[0].line_total_centavos).toBe(37_035); // 12345 * 3
  });
});

describe('createOrderAction — stock validation', () => {
  it('rejects when quantity exceeds available stock and writes no order', async () => {
    simpleItem('a', 10_000, 1);
    const result = await createOrderAction(
      baseInput({ cartItems: [{ shopItemId: 'a', variantId: null, quantity: 5 }] }),
    );

    expect(result).toEqual({ error: expect.stringContaining('Not enough stock') });
    expect(h.ordersSetSpy).not.toHaveBeenCalled();
  });

  it('rejects an inactive item', async () => {
    simpleItem('a', 10_000, 100, { active: false });
    const result = await createOrderAction(baseInput());

    expect(result).toEqual({ error: expect.stringContaining('no longer available') });
    expect(h.ordersSetSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing item', async () => {
    // nothing seeded
    const result = await createOrderAction(baseInput());
    expect(result).toEqual({ error: expect.stringContaining('no longer available') });
    expect(h.ordersSetSpy).not.toHaveBeenCalled();
  });
});

describe('createOrderAction — shipping', () => {
  it('applies the live region shipping fee on delivery and totals subtotal + shipping', async () => {
    simpleItem('a', 49_900, 100);
    const result = await createOrderAction(baseInput({ region: 'luzon', fulfillmentMethod: 'delivery' }));

    expect('orderId' in result).toBe(true);
    const order = writtenOrder();
    const expectedShipping = getShippingFee('luzon', 'delivery');
    expect(expectedShipping).toBeGreaterThan(0);
    expect(order.shipping_centavos).toBe(expectedShipping);
    expect(order.shipping_region).toBe('luzon');
    expect(order.total_centavos).toBe(order.subtotal_centavos + expectedShipping);
  });

  it('charges zero shipping and clears the region for pickup', async () => {
    simpleItem('a', 49_900, 100);
    const result = await createOrderAction(
      baseInput({ region: 'luzon', fulfillmentMethod: 'pickup', customer: {
        name: 'Buyer', email: 'buyer@example.com', phone: '09171234567', address: null,
      } }),
    );

    expect('orderId' in result).toBe(true);
    const order = writtenOrder();
    expect(order.shipping_centavos).toBe(0);
    expect(order.shipping_region).toBe('');
    expect(order.total_centavos).toBe(order.subtotal_centavos);
  });
});

describe('createOrderAction — happy path', () => {
  it('writes a pending online order and returns the order id + checkout url', async () => {
    simpleItem('a', 49_900, 100);
    const result = await createOrderAction(baseInput());

    expect(result).toEqual({ orderId: 'order-123', checkoutUrl: '/pay/stub/order-123' });

    const order = writtenOrder();
    expect(order.status).toBe('pending');
    expect(order.payment_status).toBe('pending');
    expect(order.source).toBe('online');
    expect(order.paid_at).toBeNull();
    expect(h.createCheckoutSession).toHaveBeenCalledTimes(1);
    // session id is written back onto the order after checkout creation
    expect(h.ordersUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ payment_session_id: 'sess_stub_1' }),
    );
  });
});

describe('createOrderAction — required-field validation', () => {
  it('rejects an empty cart', async () => {
    const result = await createOrderAction(baseInput({ cartItems: [] }));
    expect(result).toEqual({ error: expect.stringContaining('cart is empty') });
  });

  it('requires a delivery address on delivery', async () => {
    simpleItem('a', 49_900, 100);
    const result = await createOrderAction(
      baseInput({ customer: { name: 'B', email: 'b@e.com', phone: '09171234567', address: '' } }),
    );
    expect(result).toEqual({ error: expect.stringContaining('delivery address') });
  });

  it('requires name, email and phone', async () => {
    const result = await createOrderAction(
      baseInput({ customer: { name: '', email: '', phone: '', address: '123 St' } }),
    );
    expect(result).toEqual({ error: expect.stringContaining('name, email and phone') });
  });
});
