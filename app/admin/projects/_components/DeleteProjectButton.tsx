'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { deleteProjectAction } from '../actions';

export default function DeleteProjectButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this project and all its photos? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteProjectAction(id);
        toast.success('Project deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete project');
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} loading={isPending} className="text-red-700 hover:bg-red-50">
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
