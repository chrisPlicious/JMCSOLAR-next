'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminServicesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load services" error={error} reset={reset} />;
}
