import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking } from '@/lib/firebase/types';
import { CalendarView, type CalEvent } from './_components/CalendarView';
import AdminPageHeader from '../_components/AdminPageHeader';

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
    <div>
      <AdminPageHeader
        title="Calendar"
        description="Scheduled services by date — color-coded per service type."
      />
      <CalendarView events={events} />
    </div>
  );
}
