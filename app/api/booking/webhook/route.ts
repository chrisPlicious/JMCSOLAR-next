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

async function notifyPaid(bookingId: string): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    const admin = smtpUser();
    const amount = b.payment_amount != null ? formatCentavos(b.payment_amount) : '—';
    const when = `${b.preferred_date} ${b.preferred_time}`;

    if (b.email) {
      await sendMail({
        to: b.email,
        subject: 'Your JMC Solar consultation is confirmed',
        text: [
          `Hi ${b.name},`,
          ``,
          `We've received your payment of ${amount} — your consultation slot is reserved.`,
          `Requested time: ${when}${b.duration_hours ? ` (${b.duration_hours}hr)` : ''}`,
          `Reference: JMC-${bookingId.slice(0, 8).toUpperCase()}`,
          ``,
          `We'll email your video call link before the scheduled time.`,
          ``,
          `— JMC Solar PH`,
        ].join('\n'),
      });
    }

    if (admin) {
      await sendMail({
        to: admin,
        subject: `PAID consultation — ${b.name} (${amount})`,
        text: [
          `A consultation booking was paid.`,
          ``,
          `Name: ${b.name}`,
          `Phone: ${b.phone}`,
          `Email: ${b.email ?? 'n/a'}`,
          `City: ${b.city_name}`,
          `Requested: ${when}${b.duration_hours ? ` (${b.duration_hours}hr)` : ''}`,
          `Amount: ${amount}`,
          `Booking: /admin/bookings/${bookingId}`,
        ].join('\n'),
      });
    }
  } catch (e) {
    console.error('[webhook] notifyPaid failed', e);
  }
}
