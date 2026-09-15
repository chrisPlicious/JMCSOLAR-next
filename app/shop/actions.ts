'use server';

// Storefront server actions for the e-commerce store.
// See .claude/plans/ecommerce-store.md — Phase 3 (Checkout + Stock Validation).
//
// Server-authoritative: the client is trusted ONLY for shopItemId / variantId /
// quantity. Prices, names, SKUs, stock and totals are recomputed from Firestore.

import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/payments';
import { getShippingFee } from '@/lib/shop/shipping';
import { buildOrderLines } from '@/lib/shop/order-lines';
import { screenOrder } from '@/lib/shop/fraud';
import { markOrderPaid } from '@/lib/shop/orders';
import {
  notifyOrderReceived,
  notifyAdminNewOrder,
  notifyOrderPaid,
} from '@/lib/shop/notifications';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbOrder } from '@/lib/firebase/types';
import type { FulfillmentMethod } from '@/types';

export type CheckoutCartItem = {
  shopItemId: string;
  variantId: string | null;
  quantity: number;
};

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string | null;
};

export type CreateOrderInput = {
  cartItems: CheckoutCartItem[];
  customer: CheckoutCustomer;
  region: string;
  fulfillmentMethod: FulfillmentMethod;
};

export type CreateOrderResult =
  | { orderId: string; checkoutUrl?: string }
  | { error: string };

async function originUrl(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { cartItems, customer, region, fulfillmentMethod } = input;

  // ---- Required-field validation ----
  if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
    return { error: 'Please fill in your name, email and phone.' };
  }
  if (fulfillmentMethod === 'delivery') {
    if (!customer.address?.trim()) return { error: 'Please enter a delivery address.' };
    if (!region?.trim()) return { error: 'Please select a delivery region.' };
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { error: 'Your cart is empty.' };
  }

  try {
    // ---- Server-authoritative pricing + stock validation ----
    // Shared with the admin manual-order path so both price identically.
    const built = await buildOrderLines(cartItems);
    if (!built.ok) return { error: built.error };
    const orderItems = built.items;
    const subtotal = built.subtotalCentavos;

    const shipping = getShippingFee(region, fulfillmentMethod);
    const total = subtotal + shipping;

    // ---- #7 fraud guards ----
    const screen = screenOrder({
      quantities: cartItems.map((l) => l.quantity),
      totalCentavos: total,
      email: customer.email,
      phone: customer.phone,
    });
    if (!screen.ok) return { error: screen.reason };

    // ---- Write the order ----
    const ref = adminDb.collection('orders').doc();
    const now = new Date().toISOString();
    const order: DbOrder = {
      id: ref.id,
      items: orderItems,
      subtotal_centavos: subtotal,
      shipping_centavos: shipping,
      shipping_region: fulfillmentMethod === 'pickup' ? '' : region,
      fulfillment_method: fulfillmentMethod,
      source: 'online',
      return_status: 'none',
      total_centavos: total,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        address: customer.address?.trim() || null,
      },
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

    // ---- #11 abandoned-cart capture (best-effort, never throws) ----
    void adminDb
      .collection('abandonedCarts')
      .doc()
      .set({
        email: order.customer.email,
        items: orderItems.map((i) => ({
          shop_item_id: i.shop_item_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        recovered: false,
        reminder_sent_at: null,
        created_at: now,
      })
      .catch((e) => console.error('[createOrderAction] abandonedCarts capture failed', e));

    // ---- Checkout session + emails ----
    const origin = await originUrl();
    const provider = getPaymentProvider();

    const lineItems = orderItems.map((i) => ({
      name: i.name,
      amount: i.unit_price_centavos,
      quantity: i.quantity,
    }));
    if (shipping > 0) {
      lineItems.push({ name: 'Shipping', amount: shipping, quantity: 1 });
    }

    // Overlap the customer/admin emails with the checkout-session call (mirrors
    // createBookingAction). Both notify* helpers never throw.
    const [session] = await Promise.all([
      provider.createCheckoutSession({
        bookingId: ref.id,
        kind: 'order',
        amount: total,
        description: `JMC Solar order — ${formatCentavos(total)}`,
        lineItems,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        },
        successUrl: `${origin}/shop/confirmation?id=${ref.id}`,
        cancelUrl: `${origin}/shop/checkout`,
      }),
      notifyOrderReceived(ref.id),
      notifyAdminNewOrder(ref.id),
    ]);

    await ref.update({
      payment_session_id: session.sessionId,
      updated_at: new Date().toISOString(),
    });

    return { orderId: ref.id, checkoutUrl: session.checkoutUrl };
  } catch (e) {
    console.error('[createOrderAction]', e);
    return { error: 'Failed to place order. Please try again.' };
  }
}

/**
 * Stub-only: simulate a successful order payment for local/dev testing.
 * Guarded so it can never flip an order paid when a real provider is active.
 */
export async function simulateOrderPaymentAction(
  orderId: string,
): Promise<{ success: true } | { error: string }> {
  const provider = (process.env.PAYMENT_PROVIDER ?? 'stub').toLowerCase();
  if (provider !== 'stub') {
    return { error: 'Simulated payment is disabled when a real provider is active.' };
  }
  if (!orderId) return { error: 'Missing order id.' };

  try {
    const res = await markOrderPaid(orderId);
    if (!res) return { error: 'Order not found.' };
    // Best-effort receipt + admin alert; fire-and-forget so a slow SMTP send
    // never blocks the success response / stub-checkout redirect (dev-only path).
    // Only on the pending→paid transition — an already-paid replay must not re-send.
    if (res.transitioned) {
      void notifyOrderPaid(orderId).catch(() => {});
    }
    return { success: true };
  } catch (e) {
    console.error('[simulateOrderPaymentAction]', e);
    return { error: 'Failed to confirm payment.' };
  }
}
