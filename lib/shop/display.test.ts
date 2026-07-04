import { describe, it, expect } from 'vitest';
import {
  hasVariants,
  effectiveStock,
  priceFromCentavos,
  toShopCardItem,
  matchesQuery,
} from './display';
import type { DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

function makeVariant(over: Partial<DbShopItemVariant> = {}): DbShopItemVariant {
  return { id: 'v1', label: '100W', sku: 'SKU-100', price_centavos: 50000, stock: 4, ...over };
}

function makeItem(over: Partial<DbShopItem> = {}): DbShopItem {
  return {
    id: 'item1',
    name: 'Solar Light',
    slug: 'solar-light',
    description: 'A bright solar light',
    category: 'lights',
    sku: 'SL-1',
    price: 49900,
    stock: 12,
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
}

describe('hasVariants', () => {
  it('returns false when variants is null', () => {
    expect(hasVariants(makeItem({ variants: null }))).toBe(false);
  });

  it('returns false when variants is an empty array', () => {
    expect(hasVariants(makeItem({ variants: [] }))).toBe(false);
  });

  it('returns true when there is at least one variant', () => {
    expect(hasVariants(makeItem({ variants: [makeVariant()] }))).toBe(true);
  });
});

describe('effectiveStock', () => {
  it('returns the base stock for a simple item', () => {
    expect(effectiveStock(makeItem({ stock: 12, variants: null }))).toBe(12);
  });

  it('returns base stock when variants array is empty', () => {
    expect(effectiveStock(makeItem({ stock: 7, variants: [] }))).toBe(7);
  });

  it('sums variant stock (not the base stock) for a variant item', () => {
    const item = makeItem({
      stock: 999, // base must be ignored
      variants: [
        makeVariant({ id: 'a', stock: 3 }),
        makeVariant({ id: 'b', stock: 5 }),
      ],
    });
    expect(effectiveStock(item)).toBe(8);
  });
});

describe('priceFromCentavos', () => {
  it('returns the base price for a simple item', () => {
    expect(priceFromCentavos(makeItem({ price: 49900, variants: null }))).toBe(49900);
  });

  it('returns the cheapest variant price for a variant item', () => {
    const item = makeItem({
      price: 999999, // base must be ignored
      variants: [
        makeVariant({ id: 'a', price_centavos: 80000 }),
        makeVariant({ id: 'b', price_centavos: 50000 }),
        makeVariant({ id: 'c', price_centavos: 65000 }),
      ],
    });
    expect(priceFromCentavos(item)).toBe(50000);
  });
});

describe('toShopCardItem', () => {
  it('maps a simple item with effective stock and base price', () => {
    const item = makeItem({ stock: 12, price: 49900, variants: null });
    const card = toShopCardItem(item, 'https://cdn/img.jpg');
    expect(card).toEqual({
      id: 'item1',
      name: 'Solar Light',
      slug: 'solar-light',
      category: 'lights',
      sku: 'SL-1',
      priceCentavos: 49900,
      priceFromCentavos: 49900,
      hasVariants: false,
      stock: 12,
      imageUrl: 'https://cdn/img.jpg',
      searchText: 'solar light sl-1 a bright solar light',
    });
  });

  it('builds searchText from name, sku, description, and variant label+sku (lowercased)', () => {
    const item = makeItem({
      variants: [makeVariant({ label: 'Warm White', sku: 'SL-WW', price_centavos: 50000, stock: 3 })],
    });
    const { searchText } = toShopCardItem(item, null);
    expect(searchText).toContain('warm white');
    expect(searchText).toContain('sl-ww');
    expect(searchText).toBe(searchText.toLowerCase());
  });

  it('uses summed stock, min variant price, and hasVariants for a variant item', () => {
    const item = makeItem({
      stock: 0,
      price: 49900,
      variants: [
        makeVariant({ id: 'a', price_centavos: 80000, stock: 2 }),
        makeVariant({ id: 'b', price_centavos: 50000, stock: 5 }),
      ],
    });
    const card = toShopCardItem(item, null);
    expect(card.priceCentavos).toBe(49900); // base price passes through
    expect(card.priceFromCentavos).toBe(50000); // cheapest variant
    expect(card.hasVariants).toBe(true);
    expect(card.stock).toBe(7); // summed variant stock
  });

  it('passes through a null imageUrl', () => {
    expect(toShopCardItem(makeItem(), null).imageUrl).toBeNull();
  });
});

describe('matchesQuery', () => {
  it('matches every item when the term is empty', () => {
    expect(matchesQuery(makeItem(), '')).toBe(true);
  });

  it('matches every item when the term is only whitespace', () => {
    expect(matchesQuery(makeItem(), '   ')).toBe(true);
  });

  it('matches on the item name, case-insensitively', () => {
    expect(matchesQuery(makeItem({ name: 'Solar Light' }), 'SOLAR')).toBe(true);
  });

  it('matches on the sku', () => {
    expect(matchesQuery(makeItem({ sku: 'WIRE-42' }), 'wire-42')).toBe(true);
  });

  it('matches on the description', () => {
    expect(matchesQuery(makeItem({ description: 'Waterproof and bright' }), 'waterproof')).toBe(
      true,
    );
  });

  it('matches on a variant label', () => {
    const item = makeItem({ variants: [makeVariant({ label: '200W' })] });
    expect(matchesQuery(item, '200w')).toBe(true);
  });

  it('matches on a variant sku', () => {
    const item = makeItem({ variants: [makeVariant({ sku: 'VAR-XYZ' })] });
    expect(matchesQuery(item, 'var-xyz')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(matchesQuery(makeItem({ variants: [makeVariant()] }), 'nonexistent')).toBe(false);
  });
});
