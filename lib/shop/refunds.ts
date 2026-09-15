import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { recordStockChange } from '@/lib/shop/inventory';
import type { DbOrder, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// Shared refund core for storefront orders. Extracted from the orders webhook so
// the same transaction serves BOTH refund paths:
//   - provider refund  → PayMongo `refund.succeeded` webhook (claims the event id)
//   - manual refund    → admin settled it out of band (QRPh), no event to claim
//
// CRITICAL Firestore rule: inside a transaction, ALL reads must precede ALL
// writes. applyRefundToOrder() reads the event claim + order + every referenced
// shopItem first, then stages every write (order update, stock restore, audit).

/** Idempotency claim for the provider path. Omitted entirely on the manual path. */
export type RefundEventClaim = {
  eventId: string;
  eventType: string;
  /** Extra fields to persist on the processedWebhookEvents doc (payment id, etc). */
  extra?: Record<string, unknown>;
};

export type ApplyRefundInput = {
  orderId: string;
  /** PayMongo refund id (ref_xxx), or null when settled out of band. */
  refundId: string | null;
  /** Amount refunded, in centavos. */
  refundAmount: number;
  /** Stock-audit actor: 'webhook' for provider refunds, admin email for manual. */
  actor: string;
  /** How the money actually moved. Drives the order's refund_method field. */
  method: 'provider' | 'manual';
  /** Manual path only: why, for the audit trail. */
  note?: string | null;
  /** Provider path only: claim this webhook event inside the same transaction. */
  eventClaim?: RefundEventClaim;
};

/**
 * `refunded` — this call flipped the order and restored stock.
 * `duplicate` — already refunded, or the webhook event was already claimed. No-op.
 * `missing`   — order document doesn't exist.
 */
export type ApplyRefundResult = 'refunded' | 'duplicate' | 'missing';

/**
 * Mark an order refunded and restore stock for every line item (#13).
 *
 * Idempotent on both paths: the provider path short-circuits on an existing
 * `processedWebhookEvents` claim, and BOTH paths short-circuit when the order is
 * already `refunded` — so a webhook arriving after an admin recorded the same
 * refund manually is a safe no-op rather than a double stock restore.
 *
 * Opens its own transaction. Never partially applies: order update, every stock
 * restore, the audit rows and the event claim all commit together.
 */
export async function applyRefundToOrder(input: ApplyRefundInput): Promise<ApplyRefundResult> {
  const orderRef = adminDb.collection('orders').doc(input.orderId);
  const eventRef = input.eventClaim
    ? adminDb.collection('processedWebhookEvents').doc(input.eventClaim.eventId)
    : null;

  return adminDb.runTransaction(async (tx) => {
    // ---- READS (must all happen before any write) ----
    if (eventRef) {
      const existing = await tx.get(eventRef);
      if (existing.exists) return 'duplicate'; // replay
    }

    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) return 'missing';
    const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<DbOrder, 'id'>) };

    // Already refunded → no-op. Guards webhook-after-manual and manual-after-webhook.
    if (order.payment_status === 'refunded') return 'duplicate';

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

    // ---- Compute restores in memory (add the sold qty back) ----
    // One shopItem may be hit by several lines (different variants), so mutate a
    // working copy and write each item exactly once.
    type AuditRow = {
      shopItemId: string;
      variantId: string | null;
      delta: number;
      stockAfter: number;
    };
    const audits: AuditRow[] = [];
    const working = new Map<string, DbShopItem>();

    for (const line of order.items) {
      const entry = items.get(line.shop_item_id);
      if (!entry) {
        console.warn(`[applyRefundToOrder] shopItem ${line.shop_item_id} gone; skipping restore for order ${order.id}`);
        continue;
      }
      const item = working.get(line.shop_item_id) ?? { ...entry.data };
      working.set(line.shop_item_id, item);

      if (line.variant_id) {
        const variants: DbShopItemVariant[] = (item.variants ?? []).map((v) => ({ ...v }));
        const variant = variants.find((v) => v.id === line.variant_id);
        if (!variant) {
          console.warn(`[applyRefundToOrder] variant ${line.variant_id} gone; skipping restore`);
          continue;
        }
        variant.stock += line.quantity;
        item.variants = variants;
        audits.push({
          shopItemId: line.shop_item_id,
          variantId: line.variant_id,
          delta: line.quantity,
          stockAfter: variant.stock,
        });
      } else {
        item.stock += line.quantity;
        audits.push({
          shopItemId: line.shop_item_id,
          variantId: null,
          delta: line.quantity,
          stockAfter: item.stock,
        });
      }
    }

    // ---- WRITES (no reads beyond this point) ----
    const now = new Date().toISOString();
    tx.update(orderRef, {
      payment_status: 'refunded',
      status: 'cancelled', // refund implies the order is off
      refund_id: input.refundId,
      refunded_at: now,
      refund_amount: input.refundAmount,
      refund_method: input.method,
      refund_note: input.note ?? null,
      refund_actor: input.actor,
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
      if (a.delta === 0) continue;
      await recordStockChange(
        {
          shopItemId: a.shopItemId,
          variantId: a.variantId,
          delta: a.delta,
          reason: 'refund_restore',
          refId: order.id,
          actor: input.actor,
          stockAfter: a.stockAfter,
        },
        tx,
      );
    }

    if (eventRef && input.eventClaim) {
      tx.set(eventRef, {
        id: input.eventClaim.eventId,
        type: input.eventClaim.eventType,
        order_id: order.id,
        processed_at: now,
        ...(input.eventClaim.extra ?? {}),
      });
    }

    return 'refunded';
  });
}

/**
 * Locate the order a PayMongo refund event belongs to. Matches on the payment id
 * first (what `markOrderPaid` stores as `payment_reference`), then falls back to
 * the checkout session id.
 *
 * Returns null when no order matches — the caller should ack-and-ignore rather
 * than error, since PayMongo broadcasts events for other systems too.
 */
export async function findOrderIdByPaymentId(paymentId: string): Promise<string | null> {
  if (!paymentId) return null;

  let snap = await adminDb
    .collection('orders')
    .where('payment_reference', '==', paymentId)
    .limit(1)
    .get();

  if (snap.empty) {
    snap = await adminDb
      .collection('orders')
      .where('payment_session_id', '==', paymentId)
      .limit(1)
      .get();
  }

  return snap.empty ? null : snap.docs[0].id;
}

export type ManualRefundInput = {
  orderId: string;
  /** Centavos. Defaults to the order total when omitted. */
  amountCentavos?: number;
  /** Free-text: how it was settled (bank transfer ref, cash, etc). */
  note?: string | null;
  /** Admin email — recorded on the order and on every stock-audit row. */
  actor: string;
};

export type ManualRefundResult =
  | { ok: true; amountCentavos: number }
  | { ok: false; error: string };

/**
 * Record a refund that was settled OUTSIDE the payment provider.
 *
 * This is the path that works under QRPh, which PayMongo cannot refund: the
 * admin moves the money by bank transfer or cash, then records it here so the
 * order state, stock levels and audit log all reflect reality. It performs NO
 * provider call, which is exactly why the refund kill switch does not gate it.
 *
 * Validates before mutating: the order must exist, be paid (not already
 * refunded), and the amount must be positive and within the order total.
 */
export async function recordManualRefund(input: ManualRefundInput): Promise<ManualRefundResult> {
  if (!input.orderId) return { ok: false, error: 'Missing order id.' };
  if (!input.actor) return { ok: false, error: 'Missing actor.' };

  const snap = await adminDb.collection('orders').doc(input.orderId).get();
  if (!snap.exists) return { ok: false, error: 'Order not found.' };
  const order = { id: snap.id, ...(snap.data() as Omit<DbOrder, 'id'>) };

  if (order.payment_status === 'refunded') {
    return { ok: false, error: 'This order is already refunded.' };
  }
  if (order.payment_status !== 'paid') {
    return { ok: false, error: 'Only a paid order can be refunded.' };
  }

  const amount = input.amountCentavos ?? order.total_centavos;
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'Refund amount must be a positive whole number of centavos.' };
  }
  if (amount > order.total_centavos) {
    return { ok: false, error: 'Refund amount exceeds the order total.' };
  }

  const result = await applyRefundToOrder({
    orderId: input.orderId,
    refundId: null, // no provider refund exists
    refundAmount: amount,
    actor: input.actor,
    method: 'manual',
    note: input.note ?? null,
  });

  if (result === 'missing') return { ok: false, error: 'Order not found.' };
  if (result === 'duplicate') return { ok: false, error: 'This order is already refunded.' };

  return { ok: true, amountCentavos: amount };
}
