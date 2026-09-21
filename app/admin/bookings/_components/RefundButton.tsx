'use client';

import { useState, useTransition } from 'react';
import { refundBookingAction } from '../actions';
import { formatCentavos } from '@/lib/bookings/pricing';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface RefundButtonProps {
  bookingId: string;
  paymentAmount: number;
}

export function RefundButton({ bookingId, paymentAmount }: RefundButtonProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await refundBookingAction(bookingId, paymentAmount);
      setResult(res);
      if (res.success) {
        setOpen(false);
      }
    });
  }

  if (result?.success) {
    return <Badge tone="neutral">Refunded</Badge>;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(true); setResult(null); }}
      >
        Refund
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-card shadow-elevated p-6 w-full max-w-sm mx-4">
            <h2 id="refund-dialog-title" className="font-display text-base font-bold text-fg mb-2">
              Confirm Refund
            </h2>
            <p className="text-sm text-fg-muted mb-1">
              Refund{' '}
              <span className="font-semibold text-fg">
                {formatCentavos(paymentAmount)}
              </span>{' '}
              to the customer?
            </p>
            <p className="text-xs text-fg-subtle mb-5">
              This will call PayMongo and cannot be undone.
            </p>

            {result?.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-control px-3 py-2 mb-4">
                {result.error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirm} loading={isPending}>
                {isPending ? 'Processing…' : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
