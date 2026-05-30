'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResultAction } from '../actions';

export default function DeleteResultButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this result and its photos? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteResultAction(id);
        toast.success('Result deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete result');
      }
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
