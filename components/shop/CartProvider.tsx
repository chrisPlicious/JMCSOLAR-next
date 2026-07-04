'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext, type CartLine, type CartLineInput } from './CartContext';
import {
  addLine,
  cartSubtotalCentavos,
  cartTotalQuantity,
  removeLine,
  updateLineQty,
} from '@/lib/shop/cart';

const STORAGE_KEY = 'jmc-shop-cart';

function loadCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic shape guard — drop anything malformed.
    return parsed.filter(
      (l): l is CartLine =>
        l &&
        typeof l.shopItemId === 'string' &&
        typeof l.quantity === 'number' &&
        typeof l.unitPriceCentavos === 'number',
    );
  } catch {
    return [];
  }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount.
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  // Persist after hydration (never overwrite storage with the empty initial state).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable — ignore, cart stays in-memory */
    }
  }, [items, hydrated]);

  const addItem = useCallback((line: CartLineInput, quantity = 1) => {
    setItems((prev) => addLine(prev, line, quantity));
  }, []);

  const removeItem = useCallback((shopItemId: string, variantId: string | null) => {
    setItems((prev) => removeLine(prev, shopItemId, variantId));
  }, []);

  const updateQuantity = useCallback(
    (shopItemId: string, variantId: string | null, quantity: number) => {
      setItems((prev) => updateLineQty(prev, shopItemId, variantId, quantity));
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const totalQuantity = useMemo(() => cartTotalQuantity(items), [items]);
  const subtotalCentavos = useMemo(() => cartSubtotalCentavos(items), [items]);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalQuantity,
      subtotalCentavos,
    }),
    [items, hydrated, addItem, removeItem, updateQuantity, clear, totalQuantity, subtotalCentavos],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
