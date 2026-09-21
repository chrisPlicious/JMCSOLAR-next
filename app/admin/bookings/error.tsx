'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminBookingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load bookings" error={error} reset={reset} />;
}
