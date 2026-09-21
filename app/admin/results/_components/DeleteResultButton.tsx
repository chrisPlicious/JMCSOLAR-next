'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
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
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={isPending} className="text-red-700 hover:bg-red-50">
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
