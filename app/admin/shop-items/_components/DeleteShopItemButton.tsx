'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteShopItemAction } from '../actions';

export default function DeleteShopItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this shop item? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteShopItemAction(id);
        toast.success('Shop item deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete shop item');
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
