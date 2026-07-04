'use client';

import { createContext, useContext } from 'react';

/**
 * A single line in the client-side cart.
 *
 * Prices here are DISPLAY-ONLY. The server recomputes authoritative prices and
 * re-validates stock at checkout (see .claude/plans/ecommerce-store.md — Phase 3),
 * so nothing here is trusted for money.
 */
export interface CartLine {
  shopItemId: string;
  variantId: string | null; // null for simple items (#9)
  name: string; // item name
  variantLabel: string | null; // e.g. "100W" — null for simple items
  sku: string;
  slug: string; // storefront route key
  unitPriceCentavos: number; // display only
  imageUrl: string | null; // already a public URL
  quantity: number;
  maxStock: number; // for clamping the quantity stepper in the UI
}

/** A line to add — quantity is supplied separately (defaults to 1). */
export type CartLineInput = Omit<CartLine, 'quantity'>;

export interface CartContextValue {
  items: CartLine[];
  /** True once the cart has been hydrated from localStorage (avoids SSR/CSR mismatch). */
  hydrated: boolean;
  addItem: (line: CartLineInput, quantity?: number) => void;
  removeItem: (shopItemId: string, variantId: string | null) => void;
  updateQuantity: (shopItemId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  totalQuantity: number;
  subtotalCentavos: number;
}

/** Stable key for a cart line: item + optional variant. */
export function lineKey(shopItemId: string, variantId: string | null): string {
  return `${shopItemId}::${variantId ?? ''}`;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>');
  return ctx;
}
