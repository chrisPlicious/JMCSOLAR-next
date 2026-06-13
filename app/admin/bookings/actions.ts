'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { DbBooking } from '@/lib/firebase/types';

type ActionResult = { error?: string; success?: boolean };

const API_BASE = 'https://api.paymongo.com/v1';

function paymongoAuthHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set');
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

/**
 * Issue a refund via PayMongo and sync the booking in Firestore.
 *
 * @param bookingId      Firestore booking document id
 * @param amountCentavos Amount to refund in centavos. Defaults to full payment_amount.
 */
export async function refundBookingAction(
  bookingId: string,
  amountCentavos?: number,
): Promise<ActionResult> {
  await requireAdminAuth();

  if (!bookingId) return { error: 'Missing booking id.' };

  // 1. Fetch booking
  const ref = adminDb.collection('bookings').doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Booking not found.' };

  const booking = snap.data() as DbBooking;

  // 2. Validate state
  if (booking.payment_status !== 'paid') {
    return { error: 'Booking is not in a paid state and cannot be refunded.' };
  }
  if (!booking.payment_reference) {
    return { error: 'Booking has no payment reference — cannot issue refund.' };
  }

  // 3. Resolve and validate amount
  const defaultAmount = booking.payment_amount ?? 0;
  const amount = amountCentavos ?? defaultAmount;

  if (amount <= 0) {
    return { error: 'Refund amount must be greater than zero.' };
  }
  if (booking.payment_amount != null && amount > booking.payment_amount) {
    return { error: 'Refund amount exceeds the original payment amount.' };
  }

  // 4. Call PayMongo
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
            payment_id: booking.payment_reference,
            reason: 'others',
            notes: 'Admin-initiated refund',
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[refundBookingAction] PayMongo error', res.status, text);
      return { error: `PayMongo refund failed (${res.status}). Please try again.` };
    }

    const json = (await res.json()) as { data?: { id?: string } };
    const id = json.data?.id;
    if (!id) {
      console.error('[refundBookingAction] PayMongo response missing refund id', json);
      return { error: 'Refund was processed but the refund id was not returned.' };
    }
    refundId = id;
  } catch (e) {
    console.error('[refundBookingAction] fetch error', e);
    return { error: 'Network error while contacting PayMongo. Please try again.' };
  }

  // 5. Update Firestore
  try {
    await ref.update({
      payment_status: 'refunded',
      refund_id: refundId,
      refunded_at: new Date().toISOString(),
      refund_amount: amount,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[refundBookingAction] Firestore update error', e);
    // The refund already went through — return a partial-success message so admin knows.
    return {
      error: `Refund issued (${refundId}) but failed to update booking record. Please refresh.`,
    };
  }

  revalidatePath('/admin/bookings');
  return { success: true };
}
