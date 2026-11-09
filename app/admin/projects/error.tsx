'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load projects" error={error} reset={reset} />;
}
