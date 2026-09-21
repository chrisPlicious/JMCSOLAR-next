'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { deleteProductAction } from '../actions';

export default function DeleteProductButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        toast.success('Product deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete product');
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={isPending} className="text-red-700 hover:bg-red-50">
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
