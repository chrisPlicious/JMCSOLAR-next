'use client';
import AdminErrorState from './_components/AdminErrorState';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load dashboard" error={error} reset={reset} />;
}
