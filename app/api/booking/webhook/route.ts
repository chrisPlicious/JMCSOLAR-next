import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/payments';
import { sendMail, smtpUser } from '@/lib/email-transporter';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBooking } from '@/lib/firebase/types';

export const dynamic = 'force-dynamic';

function eventIdFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as { data?: { id?: string } };
    return json.data?.id ?? null;
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

  const eventId = eventIdFromBody(rawBody);
  const event = provider.parseWebhookEvent(rawBody);

  // Check for refund events before the provider's event parser (which only knows
  // payment events and returns 'ignored' for refund events). The dashboard exposes
  // payment.refunded / payment.refund.updated; the docs events page describes
  // refund.succeeded — handle all three.
  const rawEventType = rawEventTypeFromBody(rawBody);
  if (
    rawEventType === 'refund.succeeded' ||
    rawEventType === 'payment.refunded' ||
    rawEventType === 'payment.refund.updated'
  ) {
    return handleRefundEvent(rawEventType, rawBody, eventId);
  }

  if (event.type === 'ignored' || !eventId) {
    // Acknowledge so PayMongo doesn't retry events we don't act on.
    return NextResponse.json({ received: true });
  }

  // Idempotency: claim the event id first. If it already exists, this is a replay.
  const eventRef = adminDb.collection('processedWebhookEvents').doc(eventId);
  try {
    const claimed = await adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(eventRef);
      if (existing.exists) return false;
      tx.set(eventRef, {
        id: eventId,
        type: event.type,
        booking_id: event.bookingId,
        processed_at: new Date().toISOString(),
      });
      return true;
    });
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (e) {
    console.error('[webhook] idempotency claim failed', e);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }

  const bookingRef = adminDb.collection('bookings').doc(event.bookingId);

  if (event.type === 'payment.paid') {
    try {
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(bookingRef);
        if (!snap.exists) throw new Error(`booking ${event.bookingId} not found`);
        const b = snap.data() as DbBooking;
        if (b.payment_status === 'paid') return; // already settled
        tx.update(bookingRef, {
          payment_status: 'paid',
          payment_reference: event.paymentId,
          payment_session_id: event.sessionId || b.payment_session_id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    } catch (e) {
      console.error('[webhook] failed to mark booking paid', e);
      return NextResponse.json({ error: 'Failed to update booking.' }, { status: 500 });
    }

    // Emails are best-effort — failures are logged but must not fail the webhook
    // (else PayMongo would retry a payment we already recorded).
    await notifyPaid(event.bookingId);
    return NextResponse.json({ received: true });
  }

  if (event.type === 'payment.failed') {
    try {
      await bookingRef.update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[webhook] failed to mark booking failed', e);
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

function rawEventTypeFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as { data?: { attributes?: { type?: string } } };
    return json.data?.attributes?.type ?? null;
  } catch {
    return null;
  }
}

async function handleRefundEvent(
  eventType: string,
  rawBody: string,
  eventId: string | null,
): Promise<NextResponse> {
  if (!eventId) return NextResponse.json({ received: true });

  // data.attributes.data is either a refund resource (ref_xxx, with
  // attributes.payment_id) or a payment resource (pay_xxx) depending on event type.
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
      // Refund resource — only act on a succeeded refund (payment.refund.updated
      // also fires for failed/pending refunds).
      if (attrs?.status && attrs.status !== 'succeeded') {
        return NextResponse.json({ received: true });
      }
      paymentId = attrs?.payment_id ?? '';
      refundId = resourceId;
      refundAmount = attrs?.amount ?? 0;
    } else if (resourceId.startsWith('pay_')) {
      // Payment resource (payment.refunded) — refund id not included in payload.
      paymentId = resourceId;
      refundId = null;
      refundAmount = attrs?.amount ?? 0;
    } else {
      console.error('[webhook] unrecognized refund event resource', eventType, resourceId);
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      console.error('[webhook] refund event missing payment id', eventType);
      return NextResponse.json({ received: true });
    }
  } catch (e) {
    console.error('[webhook] failed to parse refund event body', e);
    return NextResponse.json({ received: true });
  }

  // Find the booking whose payment_reference matches the payment_id from the refund.
  // Look up the booking BEFORE claiming the event id — claiming first would burn the
  // event id on a failed lookup and make a manual resend no-op as a duplicate.
  try {
    let snap = await adminDb
      .collection('bookings')
      .where('payment_reference', '==', paymentId)
      .limit(1)
      .get();

    if (snap.empty) {
      // Fallback for bookings written by the old parser, which stored the payment id
      // in payment_session_id and left payment_reference empty.
      snap = await adminDb
        .collection('bookings')
        .where('payment_session_id', '==', paymentId)
        .limit(1)
        .get();
    }

    if (snap.empty) {
      console.error('[webhook] refund event: no booking found for payment_id', paymentId);
      return NextResponse.json({ received: true });
    }

    const bookingDoc = snap.docs[0];
    const b = bookingDoc.data() as DbBooking;

    // Idempotent: if already refunded, no-op
    if (b.payment_status === 'refunded') {
      return NextResponse.json({ received: true });
    }

    // Idempotency claim
    const eventRef = adminDb.collection('processedWebhookEvents').doc(eventId);
    const claimed = await adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(eventRef);
      if (existing.exists) return false;
      tx.set(eventRef, {
        id: eventId,
        type: eventType,
        refund_id: refundId,
        payment_id: paymentId,
        processed_at: new Date().toISOString(),
      });
      return true;
    });
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await bookingDoc.ref.update({
      payment_status: 'refunded',
      status: 'cancelled', // refund implies the job is off
      refund_id: refundId,
      refunded_at: new Date().toISOString(),
      refund_amount: refundAmount,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[webhook] failed to update booking for refund event', e);
    return NextResponse.json({ error: 'Failed to update booking.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
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

async function notifyPaid(bookingId: string): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    const admin = smtpUser();
    const amount = b.payment_amount != null ? formatCentavos(b.payment_amount) : '—';
    const when = `${b.preferred_date} ${b.preferred_time}`;
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;

    const isMaintenance = b.booking_type === 'maintenance';
    const isSiteAssessment = b.booking_type === 'site_assessment';
    const serviceLabel = isMaintenance ? 'maintenance service' : isSiteAssessment ? 'site assessment' : 'consultation';
    const scheduleDetail = isMaintenance
      ? (b.system_size_kw ? ` · ${b.system_size_kw}kW system` : '')
      : (b.duration_hours ? ` (${b.duration_hours}hr)` : '');
    const followUp = isMaintenance
      ? 'Our technician will contact you before the scheduled visit.'
      : isSiteAssessment
      ? 'Our engineer will contact you to confirm your site visit.'
      : "We'll send your video call link before the scheduled time.";

    if (b.email) {
      const customerHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Booking Confirmed</p>
        <p style="margin:0 0 28px;font-size:14px;color:#666;">Hi ${b.name}, your payment of <strong>${amount}</strong> has been received.</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetail)}
          ${row('Date & Time', when)}
          ${row('Reference', ref)}
        </table>
        <div style="margin:28px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
          <p style="margin:0;font-size:13px;color:#555;">${followUp}</p>
        </div>
      `);

      await sendMail({
        to: b.email,
        subject: `Your JMC Solar ${serviceLabel} is confirmed — ${ref}`,
        text: [
          `Hi ${b.name},`,
          ``,
          `We've received your payment of ${amount} — your ${serviceLabel} slot is reserved.`,
          `Requested time: ${when}${scheduleDetail}`,
          `Reference: ${ref}`,
          ``,
          followUp,
          ``,
          `— JMC Solar PH`,
        ].join('\n'),
        html: customerHtml,
      });
    }

    if (admin) {
      const adminHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">Payment Received</p>
        <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0a1628;">${b.name}</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetail)}
          ${row('Phone', b.phone)}
          ${row('Email', b.email ?? 'n/a')}
          ${row('City', b.city_name)}
          ${row('Requested', when)}
          ${row('Amount', `<span style="font-size:18px;color:#0a1628;">${amount}</span>`)}
        </table>
        <div style="margin:28px 0 0;">
          <a href="/admin/bookings/${bookingId}" style="display:inline-block;padding:12px 24px;background:#0a1628;color:#f5a623;font-size:13px;font-weight:700;text-decoration:none;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">View Booking</a>
        </div>
      `);

      await sendMail({
        to: admin,
        subject: `PAID ${serviceLabel} — ${b.name} (${amount})`,
        text: [
          `A ${serviceLabel} booking was paid.`,
          ``,
          `Name: ${b.name}`,
          `Phone: ${b.phone}`,
          `Email: ${b.email ?? 'n/a'}`,
          `City: ${b.city_name}`,
          `Requested: ${when}${scheduleDetail}`,
          `Amount: ${amount}`,
          `Booking: /admin/bookings/${bookingId}`,
        ].join('\n'),
        html: adminHtml,
      });
    }
  } catch (e) {
    console.error('[webhook] notifyPaid failed', e);
  }
}
