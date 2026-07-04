import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/payments';
import { recordStockChange } from '@/lib/shop/inventory';
import { notifyOrderPaid } from '@/lib/shop/notifications';
import type { DbOrder, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

/** Per-call options for marking an order paid (payment reference + audit actor). */
export type MarkOrderPaidOpts = {
  /** Real provider payment id (pay_xxx). Falls back to a stub_ ref when absent. */
  paymentReference?: string;
  /** Audit actor for the stock change: 'webhook' | 'verify' | 'system'. */
  actor?: string;
};

// Shared paid-path logic for orders. Mirrors the booking webhook's transaction
// shape: idempotency + order-paid-update + stock-decrement commit atomically.
//
// CRITICAL Firestore rule: inside a transaction, ALL reads must precede ALL
// writes. applyPaid() reads the order + every referenced shopItem first, then
// stages every write (order update, stock decrement, stockAudit row).

/** Whether the helper opened its own transaction (so it owns post-commit work). */
type ApplyResult = { order: DbOrder; markedNow: boolean };

async function applyPaid(
  tx: admin.firestore.Transaction,
  orderId: string,
  opts: MarkOrderPaidOpts = {},
): Promise<ApplyResult | null> {
  const orderRef = adminDb.collection('orders').doc(orderId);

  // ---- READS (must all happen before any write) ----
  const orderSnap = await tx.get(orderRef);
  if (!orderSnap.exists) return null;
  const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<DbOrder, 'id'>) };

  // Idempotent: already paid → no-op, do NOT decrement again.
  if (order.payment_status === 'paid') {
    return { order, markedNow: false };
  }

  // Read every referenced shopItem doc up front (unique ids).
  const itemIds = Array.from(new Set(order.items.map((i) => i.shop_item_id)));
  const itemRefs = itemIds.map((id) => adminDb.collection('shopItems').doc(id));
  const itemSnaps = await Promise.all(itemRefs.map((ref) => tx.get(ref)));
  const items = new Map<string, { ref: admin.firestore.DocumentReference; data: DbShopItem }>();
  itemSnaps.forEach((snap, idx) => {
    if (snap.exists) {
      items.set(itemIds[idx], {
        ref: itemRefs[idx],
        data: { id: snap.id, ...(snap.data() as Omit<DbShopItem, 'id'>) },
      });
    }
  });

  // ---- Compute decrements in memory (clamped, never negative) ----
  // A single shopItem may be hit by multiple lines (different variants), so
  // mutate working copies and write each item once at the end.
  type AuditRow = {
    shopItemId: string;
    variantId: string | null;
    delta: number; // signed (negative)
    stockAfter: number;
  };
  const audits: AuditRow[] = [];
  const working = new Map<string, DbShopItem>();

  for (const line of order.items) {
    const entry = items.get(line.shop_item_id);
    if (!entry) {
      console.warn(`[markOrderPaid] shopItem ${line.shop_item_id} not found for order ${orderId}; skipping decrement`);
      continue;
    }
    const item = working.get(line.shop_item_id) ?? { ...entry.data };
    working.set(line.shop_item_id, item);

    if (line.variant_id) {
      const variants: DbShopItemVariant[] = (item.variants ?? []).map((v) => ({ ...v }));
      const variant = variants.find((v) => v.id === line.variant_id);
      if (!variant) {
        console.warn(`[markOrderPaid] variant ${line.variant_id} not found on ${line.shop_item_id} (order ${orderId}); skipping`);
        continue;
      }
      const available = variant.stock;
      const newStock = Math.max(0, available - line.quantity);
      if (available < line.quantity) {
        console.warn(`[markOrderPaid] insufficient stock for variant ${line.variant_id} (have ${available}, need ${line.quantity}); clamping`);
      }
      variant.stock = newStock;
      item.variants = variants;
      audits.push({
        shopItemId: line.shop_item_id,
        variantId: line.variant_id,
        delta: newStock - available,
        stockAfter: newStock,
      });
    } else {
      const available = item.stock;
      const newStock = Math.max(0, available - line.quantity);
      if (available < line.quantity) {
        console.warn(`[markOrderPaid] insufficient stock for item ${line.shop_item_id} (have ${available}, need ${line.quantity}); clamping`);
      }
      item.stock = newStock;
      audits.push({
        shopItemId: line.shop_item_id,
        variantId: null,
        delta: newStock - available,
        stockAfter: newStock,
      });
    }
  }

  // ---- WRITES (no reads beyond this point) ----
  const now = new Date().toISOString();
  const paymentReference =
    opts.paymentReference ?? order.payment_reference ?? `stub_${crypto.randomUUID()}`;
  tx.update(orderRef, {
    status: 'paid',
    payment_status: 'paid',
    paid_at: now,
    payment_reference: paymentReference,
    updated_at: now,
  });

  for (const item of working.values()) {
    if (item.variants) {
      tx.update(items.get(item.id)!.ref, { variants: item.variants, updated_at: now });
    } else {
      tx.update(items.get(item.id)!.ref, { stock: item.stock, updated_at: now });
    }
  }

  for (const a of audits) {
    if (a.delta === 0) continue; // nothing actually moved
    await recordStockChange(
      {
        shopItemId: a.shopItemId,
        variantId: a.variantId,
        delta: a.delta,
        reason: 'sale',
        refId: orderId,
        actor: opts.actor ?? 'system',
        stockAfter: a.stockAfter,
      },
      tx,
    );
  }

  return {
    order: {
      ...order,
      status: 'paid',
      payment_status: 'paid',
      paid_at: now,
      payment_reference: paymentReference,
    },
    markedNow: true,
  };
}

/**
 * Mark matching unrecovered abandoned carts as recovered. Best-effort; never throws.
 * Exported so the orders webhook (whose tx path of `markOrderPaid` does NOT touch
 * carts) can run it post-commit.
 */
export async function markCartsRecovered(email: string): Promise<void> {
  try {
    if (!email) return;
    const snap = await adminDb
      .collection('abandonedCarts')
      .where('email', '==', email)
      .where('recovered', '==', false)
      .get();
    await Promise.all(snap.docs.map((d) => d.ref.update({ recovered: true })));
  } catch (e) {
    console.error('[markOrderPaid] markCartsRecovered failed', e);
  }
}

/**
 * Mark an order paid and decrement stock for each line item.
 *
 * Transaction-aware:
 *   - With `tx`: stages all reads/writes on the caller's transaction (the orders
 *     webhook passes its tx so idempotency-claim + paid + stock-decrement commit
 *     atomically). The caller owns post-commit work (e.g. abandoned-cart recovery).
 *   - Without `tx`: opens its own transaction (stub / verify-on-return path), then
 *     best-effort marks any matching abandoned carts recovered after the commit.
 *
 * `opts.paymentReference` stores the real provider payment id; absent it keeps the
 * existing reference or falls back to `stub_<uuid>`. `opts.actor` (default 'system')
 * is the stock-audit actor.
 *
 * Returns `{ order, transitioned }` where `transitioned` is true ONLY when this call
 * flipped pending→paid (false for an idempotent already-paid no-op). Returns `null`
 * when the order doesn't exist.
 */
export async function markOrderPaid(
  orderId: string,
  tx?: admin.firestore.Transaction,
  opts: MarkOrderPaidOpts = {},
): Promise<{ order: DbOrder; transitioned: boolean } | null> {
  if (tx) {
    const result = await applyPaid(tx, orderId, opts);
    return result ? { order: result.order, transitioned: result.markedNow } : null;
  }

  const result = await adminDb.runTransaction((t) => applyPaid(t, orderId, opts));
  if (result?.markedNow) {
    await markCartsRecovered(result.order.customer.email);
  }
  return result ? { order: result.order, transitioned: result.markedNow } : null;
}

/**
 * Verify-on-return reconciliation. When the customer lands back on the confirmation
 * page (works on localhost AND prod, regardless of whether a webhook reached us), we
 * ask the provider whether the checkout session was actually paid and, if so, flip the
 * order paid + decrement stock via `markOrderPaid`.
 *
 * Never throws — the confirmation page MUST still render. On any error the
 * originally-loaded order is returned unchanged.
 */
export async function reconcileOrderPayment(orderId: string): Promise<DbOrder | null> {
  const orderRef = adminDb.collection('orders').doc(orderId);
  let order: DbOrder | null = null;
  try {
    const snap = await orderRef.get();
    if (!snap.exists) return null;
    order = { id: snap.id, ...(snap.data() as Omit<DbOrder, 'id'>) };

    // Only reconcile orders that are still awaiting payment and went through checkout.
    if (order.payment_status !== 'pending') return order;
    if (!order.payment_session_id) return order;

    const status = await getPaymentProvider().getCheckoutSessionStatus(order.payment_session_id);
    if (!status.paid) return order;

    const res = await markOrderPaid(orderId, undefined, {
      paymentReference: status.paymentId ?? undefined,
      actor: 'verify',
    });
    if (res?.transitioned) {
      // Best-effort receipt + admin alert; never block the page render.
      void notifyOrderPaid(orderId).catch(() => {});
    }

    // Re-read so the page renders from the freshest state.
    const fresh = await orderRef.get();
    if (!fresh.exists) return order;
    return { id: fresh.id, ...(fresh.data() as Omit<DbOrder, 'id'>) };
  } catch (e) {
    console.error('[reconcileOrderPayment]', e);
    return order;
  }
}
