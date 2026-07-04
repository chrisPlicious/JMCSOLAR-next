import type { DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// Pure, dependency-free shop display helpers — safe to import from server
// components, client components, and the sitemap (no firebase-admin coupling).

/** True when the item has at least one variant (#9). */
export function hasVariants(item: Pick<DbShopItem, 'variants'>): boolean {
  return Array.isArray(item.variants) && item.variants.length > 0;
}

/**
 * Total sellable units. Sum of variant stock when variants exist, else base stock.
 */
export function effectiveStock(item: Pick<DbShopItem, 'variants' | 'stock'>): number {
  if (hasVariants(item)) {
    return (item.variants as DbShopItemVariant[]).reduce((sum, v) => sum + v.stock, 0);
  }
  return item.stock;
}

/**
 * Lowest advertised price in centavos. For variant items this is the cheapest
 * variant ("from ₱X"); for simple items it's the base price.
 */
export function priceFromCentavos(item: Pick<DbShopItem, 'variants' | 'price'>): number {
  if (hasVariants(item)) {
    return Math.min(...(item.variants as DbShopItemVariant[]).map((v) => v.price_centavos));
  }
  return item.price;
}

/**
 * Free-text search match across name, sku, description, and (for variant items)
 * each variant's label + sku (#8). Case-insensitive; an empty/blank term matches
 * every item.
 */
export function matchesQuery(
  item: Pick<DbShopItem, 'name' | 'sku' | 'description' | 'variants'>,
  term: string,
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const haystacks = [item.name, item.sku, item.description];
  if (item.variants) {
    for (const v of item.variants) haystacks.push(v.label, v.sku);
  }
  return haystacks.some((h) => h.toLowerCase().includes(needle));
}

/** Serializable shape passed from server pages to the client storefront UI. */
export interface ShopCardItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  sku: string;
  priceCentavos: number; // base price
  priceFromCentavos: number; // cheapest variant or base price
  hasVariants: boolean;
  stock: number; // effective (variant-aware) stock
  imageUrl: string | null;
  searchText: string; // precomputed lowercase haystack for client-side live search (#8)
}

/** Lowercase haystack of every searchable field (name/sku/description + variant label+sku). */
function buildSearchText(item: DbShopItem): string {
  const parts = [item.name, item.sku, item.description];
  if (item.variants) {
    for (const v of item.variants) parts.push(v.label, v.sku);
  }
  return parts.join(' ').toLowerCase();
}

/** Build the serializable card item from a DB item + a resolved public image URL. */
export function toShopCardItem(item: DbShopItem, imageUrl: string | null): ShopCardItem {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category: item.category,
    sku: item.sku,
    priceCentavos: item.price,
    priceFromCentavos: priceFromCentavos(item),
    hasVariants: hasVariants(item),
    stock: effectiveStock(item),
    imageUrl,
    searchText: buildSearchText(item),
  };
}
