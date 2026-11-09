import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking } from '@/lib/firebase/types';
import { BookingsList } from './_components/BookingsList';
import AdminPageHeader from '../_components/AdminPageHeader';

export const metadata = { title: 'Bookings — Admin' };

async function getBookings(): Promise<DbBooking[]> {
  const snap = await adminDb
    .collection('bookings')
    .orderBy('created_at', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DbBooking));
}

export default async function AdminBookingsPage() {
  await requireAdminAuth();
  const bookings = await getBookings();

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description={`${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}`}
      />

      <BookingsList bookings={bookings} />
    </div>
  );
}
