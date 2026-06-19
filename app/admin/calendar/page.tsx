import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking } from '@/lib/firebase/types';
import { CalendarView, type CalEvent } from './_components/CalendarView';

export const metadata = { title: 'Calendar — Admin' };
export const dynamic = 'force-dynamic';

async function getEvents(): Promise<CalEvent[]> {
  // preferred_date is a "YYYY-MM-DD" string, so lexical ordering == chronological.
  const snap = await adminDb
    .collection('bookings')
    .orderBy('preferred_date', 'desc')
    .limit(400)
    .get();

  return snap.docs.map((d) => {
    const b = d.data() as DbBooking;
    return {
      id: d.id,
      name: b.name,
      booking_type: b.booking_type ?? 'consultation',
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      status: b.status,
      city_name: b.city_name,
      phone: b.phone,
      payment_status: b.payment_status,
    };
  });
}

export default async function AdminCalendarPage() {
  await requireAdminAuth();
  const events = await getEvents();

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Calendar
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Scheduled services by date — color-coded per service type.</p>
      </div>
      <CalendarView events={events} />
    </div>
  );
}
