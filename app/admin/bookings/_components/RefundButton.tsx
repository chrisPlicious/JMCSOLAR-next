'use client';

import { useState, useTransition } from 'react';
import { refundBookingAction } from '../actions';
import { formatCentavos } from '@/lib/bookings/pricing';

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
    return (
      <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
        Refunded
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setResult(null); }}
        className="text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-0.5 rounded-full transition-colors"
      >
        Refund
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2
              id="refund-dialog-title"
              className="text-base font-bold text-navy-900 mb-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Confirm Refund
            </h2>
            <p className="text-sm text-slate-600 mb-1">
              Refund{' '}
              <span className="font-semibold text-navy-900">
                {formatCentavos(paymentAmount)}
              </span>{' '}
              to the customer?
            </p>
            <p className="text-xs text-slate-400 mb-5">
              This will call PayMongo and cannot be undone.
            </p>

            {result?.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {result.error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Processing…' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
