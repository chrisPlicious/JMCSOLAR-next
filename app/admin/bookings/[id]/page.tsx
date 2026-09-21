import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking } from '@/lib/firebase/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BookingDetails } from '../_components/BookingDetails';
import AdminPageHeader from '../../_components/AdminPageHeader';

export const metadata = { title: 'Booking — Admin' };
export const dynamic = 'force-dynamic';

async function getBooking(id: string): Promise<DbBooking | null> {
  const snap = await adminDb.collection('bookings').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as DbBooking;
}

/** Deep-link page (e.g. from admin emails). In-app, bookings open in a slide-in drawer. */
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth();
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg transition-colors mb-5"
      >
        <ArrowLeft size={15} aria-hidden />
        All bookings
      </Link>
      <AdminPageHeader title="Booking details" />
      <BookingDetails booking={b} />
    </div>
  );
}
