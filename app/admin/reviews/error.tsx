'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminReviewsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load reviews" error={error} reset={reset} />;
}
