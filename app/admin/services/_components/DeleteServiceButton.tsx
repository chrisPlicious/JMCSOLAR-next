'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { deleteService } from '../actions';

export default function DeleteServiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteService(id);
        toast.success('Service deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete service');
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={isPending} className="text-red-700 hover:bg-red-50">
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
