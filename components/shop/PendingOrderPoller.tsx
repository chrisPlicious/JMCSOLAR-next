'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * While an order is still `pending` on the confirmation page, refresh the route on
 * an interval so the server can re-run verify-on-return reconciliation. This covers
 * the case where payment lands a few seconds after the customer returns (e.g. a 3DS
 * delay) — the page self-updates to "received" once the payment confirms.
 *
 * Rendered only when the resolved order is still pending. Stops after ~10 tries.
 */
export default function PendingOrderPoller() {
  const router = useRouter();
  const tries = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tries.current += 1;
      if (tries.current > 10) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
