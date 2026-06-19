import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking } from '@/lib/firebase/types';
import { BookingsList } from './_components/BookingsList';

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
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Bookings
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <BookingsList bookings={bookings} />
    </div>
  );
}
