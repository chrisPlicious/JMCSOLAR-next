'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { orderRefundsEnabled, ORDER_REFUNDS_DISABLED_MESSAGE } from '@/lib/shop/refund-switch';
import { applyRefundToOrder, recordManualRefund } from '@/lib/shop/refunds';
import { buildOrderLines, type OrderLineInput } from '@/lib/shop/order-lines';
import { getShippingFee } from '@/lib/shop/shipping';
import { markOrderPaid } from '@/lib/shop/orders';
import { notifyOrderRefunded, notifyOrderPaid, notifyOrderReceived } from '@/lib/shop/notifications';
import type { DbOrder, DbOrderStatus, DbFulfillmentMethod } from '@/lib/firebase/types';

type ActionResult = { error?: string; success?: boolean };

const API_BASE = 'https://api.paymongo.com/v1';

function paymongoAuthHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set');
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

// Allowed order statuses. Mirrors DbOrderStatus — validated server-side so a
// client can never write an arbitrary value.
const ORDER_STATUSES: DbOrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
];

/**
 * Transition an order to a new status. Admin-only.
 *
 * Read-only beyond the status change: this does NOT touch payment, stock, or
 * refunds (those live in later Phase 5 work). It only sets `status` + `updated_at`.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: DbOrderStatus,
): Promise<ActionResult> {
  await requireAdminAuth();

  if (!orderId) return { error: 'Missing order id.' };
  if (!ORDER_STATUSES.includes(newStatus)) {
    return { error: 'Invalid order status.' };
  }

  const ref = adminDb.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Order not found.' };

  try {
    await ref.update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    console.error('[updateOrderStatusAction]', e);
    return { error: 'Failed to update order status.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/orders/' + orderId);
  return { success: true };
}

export type ManualOrderInput = {
  lines: OrderLineInput[];
  customer: { name: string; email: string; phone: string; address: string | null };
  region: string;
  fulfillmentMethod: DbFulfillmentMethod;
  /** Mark paid immediately (cash/GCash already collected) vs leave awaiting payment. */
  markPaid: boolean;
  /** Email the customer. Ignored when no email was supplied (walk-ins often have none). */
  notifyCustomer: boolean;
};

export type ManualOrderResult = { orderId: string } | { error: string };

/**
 * #19 — Create an order on the customer's behalf (phone or walk-in).
 *
 * Prices come from `buildOrderLines`, the SAME server-authoritative builder the
 * storefront checkout uses, so a manual order can never be priced differently
 * from an online one. Stock is decremented through the shared `markOrderPaid`
 * path, which also writes the `stockAudit` row — no bespoke stock logic here.
 *
 * Deliberately skips `screenOrder` (the #7 fraud caps): those exist to stop
 * anonymous abuse at checkout, and would block a legitimate large phone order
 * placed by a staff member who is already authenticated.
 *
 * No payment session is created. A `markPaid` order records payment as collected
 * out of band (`manual_<uuid>` reference); otherwise it sits `pending` for the
 * admin to settle later.
 */
export async function createManualOrderAction(
  input: ManualOrderInput,
): Promise<ManualOrderResult> {
  await requireAdminAuth();

  const name = input.customer?.name?.trim() ?? '';
  const phone = input.customer?.phone?.trim() ?? '';
  const email = input.customer?.email?.trim() ?? '';
  const address = input.customer?.address?.trim() || null;

  if (!name) return { error: 'Customer name is required.' };
  if (!phone) return { error: 'Customer phone is required.' };
  if (input.fulfillmentMethod === 'delivery') {
    if (!address) return { error: 'A delivery address is required.' };
    if (!input.region?.trim()) return { error: 'A delivery region is required.' };
  }

  try {
    const built = await buildOrderLines(input.lines);
    if (!built.ok) return { error: built.error };

    const shipping = getShippingFee(input.region, input.fulfillmentMethod);
    const total = built.subtotalCentavos + shipping;

    const ref = adminDb.collection('orders').doc();
    const now = new Date().toISOString();
    const order: DbOrder = {
      id: ref.id,
      items: built.items,
      subtotal_centavos: built.subtotalCentavos,
      shipping_centavos: shipping,
      shipping_region: input.fulfillmentMethod === 'pickup' ? '' : input.region,
      fulfillment_method: input.fulfillmentMethod,
      source: 'manual',
      return_status: 'none',
      total_centavos: total,
      customer: { name, email, phone, address },
      status: 'pending',
      payment_status: 'pending',
      payment_reference: null,
      payment_session_id: null,
      paid_at: null,
      refund_id: null,
      refunded_at: null,
      refund_amount: null,
      created_at: now,
      updated_at: null,
    };
    await ref.set(order);

    // Flip to paid through the shared path so stock decrement + stockAudit match
    // every other paid route exactly.
    if (input.markPaid) {
      const res = await markOrderPaid(ref.id, undefined, {
        paymentReference: `manual_${crypto.randomUUID()}`,
        actor: 'admin',
      });
      if (!res) return { error: 'Order was created but could not be marked paid.' };
    }

    // Best-effort, and only when there is somewhere to send it.
    if (input.notifyCustomer && email) {
      if (input.markPaid) {
        void notifyOrderPaid(ref.id).catch(() => {});
      } else {
        void notifyOrderReceived(ref.id).catch(() => {});
      }
    }

    revalidatePath('/admin/orders');
    return { orderId: ref.id };
  } catch (e) {
    console.error('[createManualOrderAction]', e);
    return { error: 'Failed to create the order. Please try again.' };
  }
}

/**
 * Issue a refund through PayMongo and sync the order (#13 stock restore included).
 * Admin-only. Mirrors `refundBookingAction` but routes the Firestore mutation
 * through the shared `applyRefundToOrder` transaction so the webhook and this
 * action can never disagree about stock.
 *
 * GATED by the refund kill switch: the live payment method (QRPh) has no PayMongo
 * refund API, so this path cannot succeed today. Use `recordManualRefundAction`
 * instead until a refundable method is enabled. See lib/shop/refund-switch.ts.
 *
 * @param orderId        Firestore order document id
 * @param amountCentavos Amount to refund in centavos. Defaults to the order total.
 */
export async function refundOrderAction(
  orderId: string,
  amountCentavos?: number,
): Promise<ActionResult> {
  await requireAdminAuth();

  // Enforced server-side, not by hiding a button: server actions are public
  // HTTP endpoints and can be invoked directly.
  if (!orderRefundsEnabled()) {
    return { error: ORDER_REFUNDS_DISABLED_MESSAGE };
  }

  if (!orderId) return { error: 'Missing order id.' };

  const snap = await adminDb.collection('orders').doc(orderId).get();
  if (!snap.exists) return { error: 'Order not found.' };
  const order = { id: snap.id, ...(snap.data() as Omit<DbOrder, 'id'>) };

  if (order.payment_status === 'refunded') {
    return { error: 'This order is already refunded.' };
  }
  if (order.payment_status !== 'paid') {
    return { error: 'Order is not in a paid state and cannot be refunded.' };
  }
  if (!order.payment_reference) {
    return { error: 'Order has no payment reference — cannot issue refund.' };
  }

  const amount = amountCentavos ?? order.total_centavos;
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: 'Refund amount must be greater than zero.' };
  }
  if (amount > order.total_centavos) {
    return { error: 'Refund amount exceeds the order total.' };
  }

  // ---- Call PayMongo ----
  let refundId: string;
  try {
    const res = await fetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: paymongoAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            payment_id: order.payment_reference,
            reason: 'others',
            notes: 'Admin-initiated order refund',
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[refundOrderAction] PayMongo error', res.status, text);
      return { error: `PayMongo refund failed (${res.status}). Please try again.` };
    }

    const json = (await res.json()) as { data?: { id?: string } };
    const id = json.data?.id;
    if (!id) {
      console.error('[refundOrderAction] PayMongo response missing refund id', json);
      return { error: 'Refund was processed but the refund id was not returned.' };
    }
    refundId = id;
  } catch (e) {
    console.error('[refundOrderAction] fetch error', e);
    return { error: 'Network error while contacting PayMongo. Please try again.' };
  }

  // ---- Sync Firestore (order + stock restore + audit, atomically) ----
  let result: Awaited<ReturnType<typeof applyRefundToOrder>>;
  try {
    result = await applyRefundToOrder({
      orderId,
      refundId,
      refundAmount: amount,
      actor: 'admin',
      method: 'provider',
    });
  } catch (e) {
    console.error('[refundOrderAction] Firestore update error', e);
    // The money already moved — surface the refund id so the admin can reconcile.
    return {
      error: `Refund issued (${refundId}) but failed to update the order record. Please refresh.`,
    };
  }

  if (result === 'missing') return { error: 'Order not found.' };

  // The incoming refund webhook short-circuits on the already-refunded guard, so
  // this is the single customer email for admin-initiated refunds — no duplicate.
  if (result === 'refunded') {
    await notifyOrderRefunded(orderId, amount);
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/orders/' + orderId);
  return { success: true };
}

/**
 * Record a refund settled OUTSIDE PayMongo (bank transfer, cash, GCash send).
 *
 * This is the working path under QRPh, which has no provider refund API. It makes
 * no provider call, so it is intentionally NOT gated by the refund kill switch —
 * blocking it would leave admins with no way to keep stock and order state honest
 * after refunding a customer by hand.
 *
 * Attribution limit: the admin session is a single shared anonymous nonce
 * (see lib/auth.ts — the token carries no identity), so `refund_actor` is
 * recorded as 'admin' rather than a person. The free-text `note` is therefore
 * the only place a human can say who authorised the refund and how it was sent.
 * If per-admin attribution is ever needed, that requires admin accounts first.
 */
export async function recordManualRefundAction(
  orderId: string,
  amountCentavos?: number,
  note?: string,
): Promise<ActionResult> {
  await requireAdminAuth();

  const result = await recordManualRefund({
    orderId,
    amountCentavos,
    note: note?.trim() || null,
    actor: 'admin',
  });

  if (!result.ok) return { error: result.error };

  await notifyOrderRefunded(orderId, result.amountCentavos);

  revalidatePath('/admin/orders');
  revalidatePath('/admin/orders/' + orderId);
  return { success: true };
}
