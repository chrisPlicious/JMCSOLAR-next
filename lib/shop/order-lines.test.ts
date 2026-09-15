import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// buildOrderLines only reads shopItems docs. A tiny in-memory store is enough.
const h = vi.hoisted(() => {
  const docStore = new Map<string, Record<string, unknown> | undefined>();
  const collectionSpy = vi.fn((col: string) => ({
    doc: (id: string) => ({
      get: async () => {
        const data = docStore.get(`${col}/${id}`);
        return { exists: data !== undefined, id, data: () => data };
      },
    }),
  }));
  return { docStore, collectionSpy };
});

vi.mock('@/lib/firebase/admin', () => ({ adminDb: { collection: h.collectionSpy } }));

import { buildOrderLines } from './order-lines';

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
    price: 50000,
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

beforeEach(() => {
  vi.clearAllMocks();
  h.docStore.clear();
});

describe('buildOrderLines', () => {
  it('prices from the catalogue, never from the caller', async () => {
    seedItem('item-1', { price: 50000 });

    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: null, quantity: 3 }]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.subtotalCentavos).toBe(150000);
    expect(res.items[0]).toMatchObject({
      shop_item_id: 'item-1',
      sku: 'SFL-01',
      unit_price_centavos: 50000,
      quantity: 3,
      line_total_centavos: 150000,
    });
  });

  it('uses the variant price and labels the line with the variant', async () => {
    seedItem('item-1', {
      price: 50000,
      stock: 0,
      variants: [
        { id: 'v-200w', label: '200W', sku: 'SFL-200', price_centavos: 90000, stock: 4 },
      ],
    });

    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: 'v-200w', quantity: 2 }]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.items[0]).toMatchObject({
      name: 'Solar Flood Light — 200W',
      sku: 'SFL-200',
      unit_price_centavos: 90000,
      line_total_centavos: 180000,
    });
    expect(res.subtotalCentavos).toBe(180000);
  });

  it('sums multiple lines', async () => {
    seedItem('item-1', { price: 50000 });
    seedItem('item-2', { price: 25000, sku: 'X-2' });

    const res = await buildOrderLines([
      { shopItemId: 'item-1', variantId: null, quantity: 1 },
      { shopItemId: 'item-2', variantId: null, quantity: 2 },
    ]);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.subtotalCentavos).toBe(100000);
    expect(res.items).toHaveLength(2);
  });

  it('rejects an empty cart', async () => {
    const res = await buildOrderLines([]);
    expect(res).toEqual({ ok: false, error: 'Your cart is empty.' });
  });

  it('rejects a missing item', async () => {
    const res = await buildOrderLines([{ shopItemId: 'nope', variantId: null, quantity: 1 }]);
    expect(res).toEqual({ ok: false, error: 'One of the items is no longer available.' });
  });

  it('rejects an inactive item', async () => {
    seedItem('item-1', { active: false });
    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: null, quantity: 1 }]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain('no longer available');
  });

  it('rejects an unknown variant', async () => {
    seedItem('item-1', { variants: [] });
    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: 'ghost', quantity: 1 }]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain('unavailable');
  });

  it('rejects over-stock and names the shortfall', async () => {
    seedItem('item-1', { stock: 2 });
    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: null, quantity: 5 }]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain('Only 2 left');
  });

  it('checks variant stock independently of base stock', async () => {
    seedItem('item-1', {
      stock: 99, // plenty at the base level…
      variants: [{ id: 'v1', label: '100W', sku: 'A', price_centavos: 1000, stock: 1 }],
    });

    const res = await buildOrderLines([{ shopItemId: 'item-1', variantId: 'v1', quantity: 2 }]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain('Only 1 left'); // …but the variant is what counts
  });

  it('rejects a non-integer or zero quantity', async () => {
    seedItem('item-1');
    expect(await buildOrderLines([{ shopItemId: 'item-1', variantId: null, quantity: 0 }])).toEqual({
      ok: false,
      error: 'Invalid item in cart.',
    });
    expect(await buildOrderLines([{ shopItemId: 'item-1', variantId: null, quantity: 1.5 }])).toEqual({
      ok: false,
      error: 'Invalid item in cart.',
    });
  });
});
