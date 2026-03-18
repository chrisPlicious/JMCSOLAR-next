'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProductAction } from '../actions';

export default function DeleteProductButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-400 hover:text-red-600 text-sm transition-colors disabled:opacity-40"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
