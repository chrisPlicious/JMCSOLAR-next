import { lineKey, type CartLine, type CartLineInput } from '@/components/shop/CartContext';

// Pure, dependency-free cart transforms. The client <CartProvider> wraps these in
// React state + localStorage; keeping the logic here makes the money/stock-clamp
// rules unit-testable without a DOM. Behaviour must stay identical to the provider.

/** Clamp a requested quantity into [1, maxStock]. maxStock <= 0 → 0 (cannot add). */
export function clampQty(qty: number, maxStock: number): number {
  if (!Number.isFinite(qty)) return 0;
  const max = Math.max(0, Math.floor(maxStock));
  const q = Math.floor(qty);
  if (q < 1) return 0;
  return Math.min(q, max);
}

/**
 * Add (or merge) a line. Merges onto an existing line with the same
 * item + variant, summing quantities and clamping to maxStock. A quantity that
 * clamps to 0 is a no-op (returns the original list reference unchanged).
 */
export function addLine(
  items: CartLine[],
  line: CartLineInput,
  quantity = 1,
): CartLine[] {
  const key = lineKey(line.shopItemId, line.variantId);
  const existing = items.find((l) => lineKey(l.shopItemId, l.variantId) === key);
  if (existing) {
    const nextQty = clampQty(existing.quantity + quantity, line.maxStock);
    if (nextQty < 1) return items;
    return items.map((l) =>
      lineKey(l.shopItemId, l.variantId) === key ? { ...l, ...line, quantity: nextQty } : l,
    );
  }
  const qty = clampQty(quantity, line.maxStock);
  if (qty < 1) return items;
  return [...items, { ...line, quantity: qty }];
}

/**
 * Set a line's quantity (clamped to its maxStock). A quantity that clamps to 0
 * removes the line. An unknown line leaves the list unchanged.
 */
export function updateLineQty(
  items: CartLine[],
  shopItemId: string,
  variantId: string | null,
  quantity: number,
): CartLine[] {
  const key = lineKey(shopItemId, variantId);
  const target = items.find((l) => lineKey(l.shopItemId, l.variantId) === key);
  if (!target) return items;
  const nextQty = clampQty(quantity, target.maxStock);
  if (nextQty < 1) {
    return items.filter((l) => lineKey(l.shopItemId, l.variantId) !== key);
  }
  return items.map((l) =>
    lineKey(l.shopItemId, l.variantId) === key ? { ...l, quantity: nextQty } : l,
  );
}

/** Remove the matching item + variant line, leaving all others. */
export function removeLine(
  items: CartLine[],
  shopItemId: string,
  variantId: string | null,
): CartLine[] {
  const key = lineKey(shopItemId, variantId);
  return items.filter((l) => lineKey(l.shopItemId, l.variantId) !== key);
}

/** Display subtotal in centavos: sum of unit price × quantity across lines. */
export function cartSubtotalCentavos(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.unitPriceCentavos * l.quantity, 0);
}

/** Total number of units across all lines. */
export function cartTotalQuantity(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.quantity, 0);
}
