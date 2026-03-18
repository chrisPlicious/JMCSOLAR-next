'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '../actions';

export default function DeleteProjectButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this project and all its photos? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteProjectAction(id);
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
