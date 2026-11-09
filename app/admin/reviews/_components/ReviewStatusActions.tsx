'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { approveReview, rejectReview } from '../actions';

export default function ReviewStatusActions({
  id,
  status,
}: {
  id: string;
  status?: string;
}) {
  const [isApprovePending, startApproveTransition] = useTransition();
  const [isRejectPending, startRejectTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    startApproveTransition(async () => {
      try {
        await approveReview(id);
        toast.success('Review approved');
        router.refresh();
      } catch {
        toast.error('Failed to approve review');
      }
    });
  }

  function handleReject() {
    startRejectTransition(async () => {
      try {
        await rejectReview(id);
        toast.success('Review rejected');
        router.refresh();
      } catch {
        toast.error('Failed to reject review');
      }
    });
  }

  return (
    <>
      {status !== 'approved' && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleApprove}
          loading={isApprovePending}
          title="Approve review"
          aria-label="Approve review"
          className="text-green-700 hover:bg-green-50"
        >
          {!isApprovePending && <Check size={16} aria-hidden />}
        </Button>
      )}
      {status !== 'rejected' && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleReject}
          loading={isRejectPending}
          title="Reject review"
          aria-label="Reject review"
          className="text-red-700 hover:bg-red-50"
        >
          {!isRejectPending && <X size={16} aria-hidden />}
        </Button>
      )}
    </>
  );
}
