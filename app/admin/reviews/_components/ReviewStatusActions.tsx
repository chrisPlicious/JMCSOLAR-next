'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
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
        <button
          onClick={handleApprove}
          disabled={isApprovePending}
          title="Approve review"
          className="p-2 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40"
        >
          <Check size={16} />
        </button>
      )}
      {status !== 'rejected' && (
        <button
          onClick={handleReject}
          disabled={isRejectPending}
          title="Reject review"
          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <X size={16} />
        </button>
      )}
    </>
  );
}
