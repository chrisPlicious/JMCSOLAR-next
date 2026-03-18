'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteService } from '../actions';

export default function DeleteServiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteService(id);
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
