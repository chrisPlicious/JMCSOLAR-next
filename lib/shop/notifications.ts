import { adminDb } from '@/lib/firebase/admin';
import { sendMail, smtpUser, adminCc } from '@/lib/email-transporter';
import { formatCentavos } from '@/lib/bookings/pricing';
import { SITE_URL } from '@/lib/seo/site';
import type { DbOrder, DbAbandonedCart } from '@/lib/firebase/types';

// Storefront order emails. Mirrors lib/bookings/notifications.ts: shared SMTP
// transporter, same email shell, all functions best-effort (never throw). Each
// reads the order fresh from Firestore by id (except notifyAbandonedCart, which
// is handed the cart directly since there's no order yet).

// Operations inboxes copied on every internal (admin) notification.
const ADMIN_CC = adminCc();

// SITE_URL has a sensible production default — strip any trailing slash for links.
const BASE_URL = SITE_URL.replace(/\/$/, '');

function orderRef(orderId: string): string {
  return `JMC-${orderId.slice(0, 8).toUpperCase()}`;
}

function fulfillmentLabel(o: DbOrder): string {
  return o.fulfillment_method === 'pickup'
    ? 'Store pickup'
    : `Delivery${o.shipping_region ? ` · ${o.shipping_region}` : ''}`;
}

function emailWrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0a1628;padding:28px 36px;border-radius:8px 8px 0 0;">
            <p style="margin:0;color:#f5a623;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">JMC Solar PH</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 8px 8px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;color:#999;font-size:12px;">JMC Solar PH · Cogon, Ormoc City, Leyte</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#888;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#0a1628;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}

function ctaButton(label: string, href: string): string {
  return `<div style="margin:28px 0 0;">
    <a href="${href}" style="display:inline-block;padding:12px 24px;background:#0a1628;color:#f5a623;font-size:13px;font-weight:700;text-decoration:none;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">${label}</a>
  </div>`;
}

/** HTML rows for each order line item (name × qty → line total). */
function itemRowsHtml(o: DbOrder): string {
  return o.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;color:#0a1628;font-size:13px;vertical-align:top;">${i.name} × ${i.quantity}</td>
        <td style="padding:6px 0;color:#0a1628;font-size:13px;text-align:right;vertical-align:top;">${formatCentavos(i.line_total_centavos)}</td>
      </tr>`,
    )
    .join('');
}

/** Plain-text lines for each order item. */
function itemLinesText(o: DbOrder): string[] {
  return o.items.map((i) => `  ${i.name} × ${i.quantity} — ${formatCentavos(i.line_total_centavos)}`);
}

/** Totals block (subtotal / shipping / total) as HTML rows. */
function totalsHtml(o: DbOrder): string {
  return `
    <tr><td style="padding:6px 0;color:#888;font-size:13px;">Subtotal</td><td style="padding:6px 0;color:#0a1628;font-size:13px;text-align:right;">${formatCentavos(o.subtotal_centavos)}</td></tr>
    <tr><td style="padding:6px 0;color:#888;font-size:13px;">Shipping</td><td style="padding:6px 0;color:#0a1628;font-size:13px;text-align:right;">${formatCentavos(o.shipping_centavos)}</td></tr>
    <tr><td style="padding:8px 0 0;color:#0a1628;font-size:15px;font-weight:700;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;color:#0a1628;font-size:15px;font-weight:700;text-align:right;border-top:1px solid #eee;">${formatCentavos(o.total_centavos)}</td></tr>`;
}

async function loadOrder(orderId: string): Promise<DbOrder | null> {
  const snap = await adminDb.collection('orders').doc(orderId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<DbOrder, 'id'>) };
}

/**
 * Order placed → acknowledge to the customer that we're awaiting payment.
 * Never throws.
 */
export async function notifyOrderReceived(orderId: string): Promise<void> {
  try {
    const o = await loadOrder(orderId);
    if (!o || !o.customer.email) return;
    const ref = orderRef(o.id);

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Almost there — complete your payment</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${o.customer.name}, we've received your order. To confirm it, please complete the payment of <strong>${formatCentavos(o.total_centavos)}</strong>. Your order isn't confirmed until payment is received.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Reference', ref)}
        ${row('Fulfillment', fulfillmentLabel(o))}
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
        ${itemRowsHtml(o)}
        ${totalsHtml(o)}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">If you closed the payment window before finishing, you can start checkout again — you're only charged once payment completes.</p>
      </div>
    `);

    await sendMail({
      to: o.customer.email,
      subject: `Complete your payment — JMC Solar order (${ref})`,
      text: [
        `Hi ${o.customer.name},`,
        ``,
        `We've received your order. Complete the payment of ${formatCentavos(o.total_centavos)} to confirm it.`,
        `Reference: ${ref}`,
        `Fulfillment: ${fulfillmentLabel(o)}`,
        ``,
        `Items:`,
        ...itemLinesText(o),
        `Subtotal: ${formatCentavos(o.subtotal_centavos)}`,
        `Shipping: ${formatCentavos(o.shipping_centavos)}`,
        `Total: ${formatCentavos(o.total_centavos)}`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[shop notifications] notifyOrderReceived failed', e);
  }
}

/** Payment succeeded → receipt to customer + alert to admin. Never throws. */
export async function notifyOrderPaid(orderId: string): Promise<void> {
  try {
    const o = await loadOrder(orderId);
    if (!o) return;
    const ref = orderRef(o.id);
    const admin = smtpUser();

    if (o.customer.email) {
      const customerHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Order Confirmed</p>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${o.customer.name}, your payment of <strong>${formatCentavos(o.total_centavos)}</strong> has been received. Thank you for your order!</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Reference', ref)}
          ${row('Fulfillment', fulfillmentLabel(o))}
        </table>
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
          ${itemRowsHtml(o)}
          ${totalsHtml(o)}
        </table>
        <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
          <p style="margin:0;font-size:13px;color:#555;">${o.fulfillment_method === 'pickup' ? "We'll let you know when your order is ready for pickup." : "We'll process your order and notify you when it ships."}</p>
        </div>
      `);

      await sendMail({
        to: o.customer.email,
        subject: `Your JMC Solar order is confirmed — ${ref}`,
        text: [
          `Hi ${o.customer.name},`,
          ``,
          `We've received your payment of ${formatCentavos(o.total_centavos)} — your order is confirmed.`,
          `Reference: ${ref}`,
          `Fulfillment: ${fulfillmentLabel(o)}`,
          ``,
          `Items:`,
          ...itemLinesText(o),
          `Subtotal: ${formatCentavos(o.subtotal_centavos)}`,
          `Shipping: ${formatCentavos(o.shipping_centavos)}`,
          `Total: ${formatCentavos(o.total_centavos)}`,
          ``,
          `— JMC Solar PH`,
        ].join('\n'),
        html: customerHtml,
      });
    }

    if (admin) {
      const adminHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">Order Paid</p>
        <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0a1628;">${o.customer.name}</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Reference', ref)}
          ${row('Phone', o.customer.phone)}
          ${row('Email', o.customer.email || 'n/a')}
          ${row('Fulfillment', fulfillmentLabel(o))}
          ${o.customer.address ? row('Address', o.customer.address) : ''}
          ${row('Total', `<span style="font-size:18px;color:#0a1628;">${formatCentavos(o.total_centavos)}</span>`)}
        </table>
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
          ${itemRowsHtml(o)}
          ${totalsHtml(o)}
        </table>
        ${BASE_URL ? ctaButton('View Order', `${BASE_URL}/admin/orders/${o.id}`) : ''}
      `);

      await sendMail({
        to: admin,
        cc: ADMIN_CC,
        subject: `PAID order — ${o.customer.name} (${formatCentavos(o.total_centavos)})`,
        text: [
          `An order was paid.`,
          ``,
          `Name: ${o.customer.name}`,
          `Phone: ${o.customer.phone}`,
          `Email: ${o.customer.email || 'n/a'}`,
          `Fulfillment: ${fulfillmentLabel(o)}`,
          `Total: ${formatCentavos(o.total_centavos)}`,
          `Reference: ${ref}`,
          `Order: /admin/orders/${o.id}`,
        ].join('\n'),
        html: adminHtml,
      });
    }
  } catch (e) {
    console.error('[shop notifications] notifyOrderPaid failed', e);
  }
}

/** New order created → internal alert to the ops inbox. Never throws. */
export async function notifyAdminNewOrder(orderId: string): Promise<void> {
  try {
    const admin = smtpUser();
    if (!admin) return;
    const o = await loadOrder(orderId);
    if (!o) return;
    const ref = orderRef(o.id);

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">New Order</p>
      <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0a1628;">${o.customer.name}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Reference', ref)}
        ${row('Phone', o.customer.phone)}
        ${row('Email', o.customer.email || 'n/a')}
        ${row('Fulfillment', fulfillmentLabel(o))}
        ${o.customer.address ? row('Address', o.customer.address) : ''}
        ${row('Payment', o.payment_status === 'pending' ? `Awaiting payment (${formatCentavos(o.total_centavos)})` : o.payment_status)}
      </table>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
        ${itemRowsHtml(o)}
        ${totalsHtml(o)}
      </table>
      ${BASE_URL ? ctaButton('View Order', `${BASE_URL}/admin/orders/${o.id}`) : ''}
    `);

    await sendMail({
      to: admin,
      cc: ADMIN_CC,
      subject: `NEW order — ${o.customer.name} (${ref})`,
      text: [
        `A new order was submitted.`,
        ``,
        `Name: ${o.customer.name}`,
        `Phone: ${o.customer.phone}`,
        `Email: ${o.customer.email || 'n/a'}`,
        `Fulfillment: ${fulfillmentLabel(o)}`,
        `Total: ${formatCentavos(o.total_centavos)}`,
        `Reference: ${ref}`,
        ``,
        `Order: ${BASE_URL ? `${BASE_URL}/admin/orders/${o.id}` : `/admin/orders/${o.id}`}`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[shop notifications] notifyAdminNewOrder failed', e);
  }
}

/**
 * Payment failed → tell the customer they were not charged and the order isn't
 * confirmed. Mirrors booking `notifyFailed`. Never throws.
 */
export async function notifyOrderFailed(orderId: string): Promise<void> {
  try {
    const o = await loadOrder(orderId);
    if (!o || !o.customer.email) return;
    const ref = orderRef(o.id);
    const retryHref = BASE_URL ? `${BASE_URL}/shop/cart` : null;

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Payment didn't go through</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${o.customer.name}, your payment wasn't completed, so <strong>you were not charged</strong> and your order isn't confirmed yet.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Reference', ref)}
        ${row('Total', formatCentavos(o.total_centavos))}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#fdf6f6;border-left:3px solid #d9534f;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">No worries — no money left your account. You can try checking out again anytime.</p>
      </div>
      ${retryHref ? ctaButton('Try Again', retryHref) : ''}
    `);

    await sendMail({
      to: o.customer.email,
      subject: `Payment not completed — your JMC Solar order (${ref})`,
      text: [
        `Hi ${o.customer.name},`,
        ``,
        `Your payment wasn't completed, so you were NOT charged and the order isn't confirmed.`,
        `Reference: ${ref}`,
        `Total: ${formatCentavos(o.total_centavos)}`,
        ``,
        `No money left your account. You can try checking out again anytime${retryHref ? `: ${retryHref}` : '.'}`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[shop notifications] notifyOrderFailed failed', e);
  }
}

/**
 * Payment refunded → confirm the return to the customer. Mirrors booking
 * `notifyRefunded`. Never throws.
 */
export async function notifyOrderRefunded(orderId: string, refundCentavos?: number): Promise<void> {
  try {
    const o = await loadOrder(orderId);
    if (!o || !o.customer.email) return;
    const ref = orderRef(o.id);
    const amountCentavos = refundCentavos ?? o.refund_amount ?? o.total_centavos ?? null;
    const amount = amountCentavos != null ? formatCentavos(amountCentavos) : 'your payment';

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Refund Processed</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${o.customer.name}, we've refunded <strong>${amount}</strong> for your order. The order has been cancelled.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Reference', ref)}
        ${row('Refunded', amount)}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">The amount returns to your original payment method, typically within 5–10 banking days depending on your bank or e-wallet.</p>
      </div>
    `);

    await sendMail({
      to: o.customer.email,
      subject: `Refund processed — your JMC Solar order (${ref})`,
      text: [
        `Hi ${o.customer.name},`,
        ``,
        `We've refunded ${amount} for your order. The order has been cancelled.`,
        `Reference: ${ref}`,
        ``,
        `The amount returns to your original payment method, typically within 5–10 banking days.`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[shop notifications] notifyOrderRefunded failed', e);
  }
}

/**
 * #11 — abandoned cart recovery email. Best-effort, sent once; the dispatching
 * cron lands in a later phase. Never throws.
 */
export async function notifyAbandonedCart(cart: DbAbandonedCart): Promise<void> {
  try {
    if (!cart.email) return;
    const cartHref = BASE_URL ? `${BASE_URL}/shop/cart` : '/shop/cart';
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">You left something behind</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">You have ${itemCount} item${itemCount === 1 ? '' : 's'} waiting in your cart. Pick up where you left off — your selection is just a click away.</p>
      ${BASE_URL ? ctaButton('Return to Cart', cartHref) : ''}
      <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">Stock is limited and prices are confirmed at checkout. Complete your order before items sell out.</p>
      </div>
    `);

    await sendMail({
      to: cart.email,
      subject: `You left ${itemCount} item${itemCount === 1 ? '' : 's'} in your cart — JMC Solar`,
      text: [
        `You have ${itemCount} item${itemCount === 1 ? '' : 's'} waiting in your cart.`,
        ``,
        `Return to your cart: ${cartHref}`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[shop notifications] notifyAbandonedCart failed', e);
  }
}
