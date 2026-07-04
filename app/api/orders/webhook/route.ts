import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/payments';
import { kindFromBody, eventIdFromBody } from '@/lib/payments/webhook';
import { markOrderPaid, markCartsRecovered } from '@/lib/shop/orders';
import { recordStockChange } from '@/lib/shop/inventory';
import {
  notifyOrderPaid,
  notifyOrderFailed,
  notifyOrderRefunded,
} from '@/lib/shop/notifications';
import type { DbOrder, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

export const dynamic = 'force-dynamic';

// Storefront orders webhook. Cloned from app/api/booking/webhook/route.ts:
// verify → kind-check → idempotency-claim + mutation in ONE transaction → email.
// PayMongo broadcasts every event to all registered webhook URLs, so the FIRST
// thing we do (after signature) is ignore anything that isn't an order event.

function rawEventTypeFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as { data?: { attributes?: { type?: string } } };
    return json.data?.attributes?.type ?? null;
  } catch {
    return null;
  }
}

/** Resolve the order id from the event payload: metadata.order_id, else reference_number. */
function orderIdFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as {
      data?: {
        attributes?: {
          data?: {
            attributes?: { metadata?: { order_id?: string }; reference_number?: string };
          };
        };
      };
    };
    const attrs = json.data?.attributes?.data?.attributes;
    return attrs?.metadata?.order_id ?? attrs?.reference_number ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Must read the RAW body for HMAC verification — never re-stringify.
  const rawBody = await request.text();
  const signature = request.headers.get('paymongo-signature');

  const provider = getPaymentProvider();

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // KIND CHECK FIRST: ack-and-ignore booking/other events so we never act on (or
  // 500-retry) an event that belongs to another system.
  if (kindFromBody(rawBody) !== 'order') {
    return NextResponse.json({ received: true });
  }

  const eventId = eventIdFromBody(rawBody);

  // Refund events arrive as raw types the provider's parser returns 'ignored' for.
  const rawEventType = rawEventTypeFromBody(rawBody);
  if (
    rawEventType === 'refund.succeeded' ||
    rawEventType === 'payment.refunded' ||
    rawEventType === 'payment.refund.updated'
  ) {
    return handleRefundEvent(rawEventType, rawBody, eventId);
  }

  const event = provider.parseWebhookEvent(rawBody);
  if (event.type === 'ignored' || !eventId) {
    return NextResponse.json({ received: true });
  }

  const orderId = orderIdFromBody(rawBody) ?? event.bookingId;
  const eventRef = adminDb.collection('processedWebhookEvents').doc(eventId);
  const orderRef = adminDb.collection('orders').doc(orderId);

  if (event.type === 'payment.paid') {
    // Idempotency-claim + mark-paid + stock-decrement commit atomically (mirrors the
    // booking webhook). A transient failure rolls back both, leaving the event
    // unclaimed so a PayMongo retry can reprocess.
    let outcome:
      | { kind: 'done'; transitioned: boolean; order: DbOrder }
      | { kind: 'duplicate' }
      | { kind: 'missing' };
    try {
      outcome = await adminDb.runTransaction(async (tx) => {
        const existing = await tx.get(eventRef);
        if (existing.exists) return { kind: 'duplicate' } as const; // replay
        const res = await markOrderPaid(orderId, tx, {
          paymentReference: event.paymentId,
          actor: 'webhook',
        });
        // Order doc missing inside the tx → ack-and-ignore (do NOT claim, do NOT throw).
        if (!res) return { kind: 'missing' } as const;
        tx.set(eventRef, {
          id: eventId,
          type: event.type,
          order_id: orderId,
          processed_at: new Date().toISOString(),
        });
        return { kind: 'done', transitioned: res.transitioned, order: res.order } as const;
      });
    } catch (e) {
      console.error('[orders webhook] failed to mark order paid', e);
      return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
    }

    if (outcome.kind === 'duplicate') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (outcome.kind === 'missing') {
      console.warn(`[orders webhook] order ${orderId} not found; ack-and-ignore`);
      return NextResponse.json({ received: true });
    }

    // Post-commit, best-effort (the tx path of markOrderPaid does NOT do these):
    if (outcome.transitioned) {
      await markCartsRecovered(outcome.order.customer.email);
      // Emails are best-effort — never fail the webhook (would trigger a retry of a
      // payment we already recorded). Only on the pending→paid transition.
      await notifyOrderPaid(orderId);
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === 'payment.failed') {
    let result: 'done' | 'duplicate' | 'missing';
    try {
      result = await adminDb.runTransaction(async (tx) => {
        const existing = await tx.get(eventRef);
        if (existing.exists) return 'duplicate' as const;
        const snap = await tx.get(orderRef);
        if (!snap.exists) return 'missing' as const; // ack-and-ignore
        const now = new Date().toISOString();
        tx.update(orderRef, {
          payment_status: 'failed',
          status: 'failed',
          updated_at: now,
        });
        tx.set(eventRef, {
          id: eventId,
          type: event.type,
          order_id: orderId,
          processed_at: now,
        });
        return 'done' as const;
      });
    } catch (e) {
      console.error('[orders webhook] failed to mark order failed', e);
      return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
    }

    if (result === 'duplicate') return NextResponse.json({ received: true, duplicate: true });
    if (result === 'missing') {
      console.warn(`[orders webhook] order ${orderId} not found (failed); ack-and-ignore`);
      return NextResponse.json({ received: true });
    }

    // Best-effort: tell the customer the payment didn't go through (no charge).
    await notifyOrderFailed(orderId);
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

/**
 * Refund handler. Mirrors the booking refund flow but additionally restores stock
 * (#13): each line's quantity is re-added to its variant/base stock and audited as a
 * `refund_restore`. Idempotent via the event-id claim + the already-refunded guard.
 */
async function handleRefundEvent(
  eventType: string,
  rawBody: string,
  eventId: string | null,
): Promise<NextResponse> {
  if (!eventId) return NextResponse.json({ received: true });

  let paymentId: string;
  let refundId: string | null;
  let refundAmount: number;
  try {
    const json = JSON.parse(rawBody) as {
      data?: {
        attributes?: {
          data?: {
            id?: string;
            attributes?: { payment_id?: string; amount?: number; status?: string };
          };
        };
      };
    };
    const resource = json.data?.attributes?.data;
    const attrs = resource?.attributes;
    const resourceId = resource?.id ?? '';

    if (resourceId.startsWith('ref_')) {
      if (attrs?.status && attrs.status !== 'succeeded') {
        return NextResponse.json({ received: true });
      }
      paymentId = attrs?.payment_id ?? '';
      refundId = resourceId;
      refundAmount = attrs?.amount ?? 0;
    } else if (resourceId.startsWith('pay_')) {
      paymentId = resourceId;
      refundId = null;
      refundAmount = attrs?.amount ?? 0;
    } else {
      console.error('[orders webhook] unrecognized refund event resource', eventType, resourceId);
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      console.error('[orders webhook] refund event missing payment id', eventType);
      return NextResponse.json({ received: true });
    }
  } catch (e) {
    console.error('[orders webhook] failed to parse refund event body', e);
    return NextResponse.json({ received: true });
  }

  // Find the order whose payment_reference matches the refunded payment id. Look up
  // BEFORE claiming the event id (claiming first would burn it on a failed lookup).
  try {
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

    if (snap.empty) {
      console.error('[orders webhook] refund event: no order found for payment_id', paymentId);
      return NextResponse.json({ received: true });
    }

    const orderRef = snap.docs[0].ref;

    // Idempotent: if already refunded, no-op.
    if ((snap.docs[0].data() as DbOrder).payment_status === 'refunded') {
      return NextResponse.json({ received: true });
    }

    const eventRef = adminDb.collection('processedWebhookEvents').doc(eventId);
    const claimed = await adminDb.runTransaction(async (tx) => {
      // ---- READS (all before any write) ----
      const existing = await tx.get(eventRef);
      if (existing.exists) return false; // replay
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) return false; // ack-and-ignore
      const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<DbOrder, 'id'>) };
      if (order.payment_status === 'refunded') return false; // idempotent

      const itemIds = Array.from(new Set(order.items.map((i) => i.shop_item_id)));
      const itemRefs = itemIds.map((id) => adminDb.collection('shopItems').doc(id));
      const itemSnaps = await Promise.all(itemRefs.map((ref) => tx.get(ref)));
      const items = new Map<
        string,
        { ref: typeof itemRefs[number]; data: DbShopItem }
      >();
      itemSnaps.forEach((s, idx) => {
        if (s.exists) {
          items.set(itemIds[idx], {
            ref: itemRefs[idx],
            data: { id: s.id, ...(s.data() as Omit<DbShopItem, 'id'>) },
          });
        }
      });

      // ---- Compute restores in memory (add the sold qty back) ----
      type AuditRow = { shopItemId: string; variantId: string | null; delta: number; stockAfter: number };
      const audits: AuditRow[] = [];
      const working = new Map<string, DbShopItem>();
      for (const line of order.items) {
        const entry = items.get(line.shop_item_id);
        if (!entry) {
          console.warn(`[orders webhook] shopItem ${line.shop_item_id} gone; skipping restore for order ${order.id}`);
          continue;
        }
        const item = working.get(line.shop_item_id) ?? { ...entry.data };
        working.set(line.shop_item_id, item);

        if (line.variant_id) {
          const variants: DbShopItemVariant[] = (item.variants ?? []).map((v) => ({ ...v }));
          const variant = variants.find((v) => v.id === line.variant_id);
          if (!variant) {
            console.warn(`[orders webhook] variant ${line.variant_id} gone; skipping restore`);
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

      // ---- WRITES ----
      const now = new Date().toISOString();
      tx.update(orderRef, {
        payment_status: 'refunded',
        status: 'cancelled', // refund implies the order is off
        refund_id: refundId,
        refunded_at: now,
        refund_amount: refundAmount,
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
            actor: 'webhook',
            stockAfter: a.stockAfter,
          },
          tx,
        );
      }
      tx.set(eventRef, {
        id: eventId,
        type: eventType,
        refund_id: refundId,
        payment_id: paymentId,
        order_id: order.id,
        processed_at: now,
      });
      return true;
    });

    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Best-effort: confirm the refund to the customer.
    await notifyOrderRefunded(snap.docs[0].id, refundAmount);
  } catch (e) {
    console.error('[orders webhook] failed to update order for refund event', e);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
