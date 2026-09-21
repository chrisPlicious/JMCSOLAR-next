'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminCalendarError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load calendar" error={error} reset={reset} />;
}
