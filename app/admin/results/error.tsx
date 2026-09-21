'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminResultsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load results" error={error} reset={reset} />;
}
