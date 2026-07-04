'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/components/shop/CartContext';

/**
 * Clears the client cart exactly once after an order lands on the confirmation page.
 *
 * MUST wait for the cart to hydrate first. This component is a child of
 * <CartProvider>, and React fires child effects before parent effects — so on a
 * fresh full-page load (e.g. returning from the PayMongo redirect) an unguarded
 * clear() runs BEFORE the provider hydrates from localStorage, and the subsequent
 * hydration reloads the old cart, silently undoing the clear. Gating on `hydrated`
 * makes the clear run after hydration, so it sticks (and persists empty to storage).
 */
export default function ClearCartOnPaid() {
  const { clear, hydrated } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    clear();
  }, [hydrated, clear]);

  return null;
}
