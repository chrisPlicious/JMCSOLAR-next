import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendBookingReminder } from '@/lib/bookings/notifications';
import type { DbBooking } from '@/lib/firebase/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Statuses still worth reminding the team about (a cancelled/completed booking isn't).
const REMINDABLE_STATUSES = new Set(['pending', 'confirmed']);
// Don't remind for bookings whose payment failed or was refunded.
const SKIP_PAYMENT_STATUSES = new Set(['failed', 'refunded']);

/** Local (Asia/Manila, UTC+8, no DST) calendar date `days` from now, as YYYY-MM-DD. */
function phDatePlus(days: number): string {
  const phNow = new Date(Date.now() + 8 * 3600 * 1000);
  phNow.setUTCDate(phNow.getUTCDate() + days);
  return phNow.toISOString().slice(0, 10);
}

/**
 * Daily cron. For services scheduled 2 days and 1 day out, emails an internal
 * reminder (Zoho inbox, CC ops Gmail). Idempotent: a `reminder_Nd_sent` flag on
 * each booking prevents duplicate sends if the job runs more than once a day.
 *
 * Protected by CRON_SECRET — Vercel Cron sends `Authorization: Bearer <secret>`
 * automatically when the env var is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const targets: { days: number; date: string; flag: 'reminder_2d_sent' | 'reminder_1d_sent' }[] = [
    { days: 2, date: phDatePlus(2), flag: 'reminder_2d_sent' },
    { days: 1, date: phDatePlus(1), flag: 'reminder_1d_sent' },
  ];

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { days, date, flag } of targets) {
    try {
      // Single-field equality — no composite index needed; status filtered in JS.
      const snap = await adminDb.collection('bookings').where('preferred_date', '==', date).get();

      for (const doc of snap.docs) {
        const b = { id: doc.id, ...doc.data() } as DbBooking;

        if (b[flag]) { skipped++; continue; }
        if (!REMINDABLE_STATUSES.has(b.status)) { skipped++; continue; }
        if (b.payment_status && SKIP_PAYMENT_STATUSES.has(b.payment_status)) { skipped++; continue; }
        // Pay-first bookings that were never paid shouldn't trigger a reminder.
        if (b.payment_status === 'pending') { skipped++; continue; }

        const ok = await sendBookingReminder(b, days);
        if (ok) {
          await doc.ref.update({ [flag]: true, updated_at: new Date().toISOString() });
          sent++;
        } else {
          errors.push(`${b.id}: send returned false`);
        }
      }
    } catch (e) {
      errors.push(`${date}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, dates: targets.map((t) => t.date) });
}
