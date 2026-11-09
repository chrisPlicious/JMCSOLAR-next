'use client';
import AdminErrorState from '../_components/AdminErrorState';

export default function AdminProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState title="Failed to load products" error={error} reset={reset} />;
}
