'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbOrder } from '@/lib/firebase/types';
import { refundOrderAction, recordManualRefundAction } from '../actions';

type Mode = 'provider' | 'manual';

/**
 * Refund controls for the order detail page.
 *
 * Two paths, deliberately different:
 *   - Provider refund calls PayMongo. Only offered when the server says refunds
 *     are enabled (`refundsEnabled`), which today they are not — QRPh has no
 *     refund API. The server action enforces this too; this prop only decides
 *     whether the button is worth showing.
 *   - Manual refund records money already sent out of band. Always available.
 *
 * Both are irreversible, so both go through an explicit confirm dialog.
 */
export function RefundPanel({
  order,
  refundsEnabled,
}: {
  order: DbOrder;
  refundsEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [amountPesos, setAmountPesos] = useState(String(order.total_centavos / 100));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Already refunded → show the record, offer nothing.
  if (order.payment_status === 'refunded') {
    return (
      <div className="mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
            Refunded
          </span>
          {order.refund_method === 'manual' && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Settled manually
            </span>
          )}
        </div>
        {order.refund_note && (
          <p className="text-sm text-slate-600 break-words">
            <span className="text-slate-400">Note:</span> {order.refund_note}
          </p>
        )}
        {order.refund_method === 'manual' && (
          <p className="text-xs text-slate-400 mt-1">
            No PayMongo refund exists for this order — the money was sent outside the
            payment provider.
          </p>
        )}
      </div>
    );
  }

  // Only a paid order can be refunded at all.
  if (order.payment_status !== 'paid') {
    return null;
  }

  const centavos = Math.round(Number(amountPesos.replace(/,/g, '')) * 100);
  const amountValid = Number.isInteger(centavos) && centavos > 0 && centavos <= order.total_centavos;

  function close() {
    setMode(null);
    setError(null);
    setNote('');
    setAmountPesos(String(order.total_centavos / 100));
  }

  function handleConfirm() {
    if (!mode || !amountValid) return;
    setError(null);
    startTransition(async () => {
      const res =
        mode === 'provider'
          ? await refundOrderAction(order.id, centavos)
          : await recordManualRefundAction(order.id, centavos, note);

      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(
        mode === 'provider' ? 'Refund issued through PayMongo.' : 'Manual refund recorded.',
      );
      close();
      router.refresh();
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-50">
      <div className="flex items-center gap-2 flex-wrap">
        {refundsEnabled && (
          <button
            type="button"
            onClick={() => { setMode('provider'); setError(null); }}
            className="text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            Refund via PayMongo
          </button>
        )}
        <button
          type="button"
          onClick={() => { setMode('manual'); setError(null); }}
          className="text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          Record manual refund
        </button>
      </div>

      {!refundsEnabled && (
        <p className="text-xs text-slate-400 mt-2">
          Automatic refunds are off — the active payment method (QRPh) cannot be refunded
          through PayMongo. Send the money yourself, then record it here so stock and
          order status stay correct.
        </p>
      )}

      {mode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-panel-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isPending) close(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2
              id="refund-panel-title"
              className="text-base font-bold text-navy-900 mb-1"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {mode === 'provider' ? 'Refund via PayMongo' : 'Record a manual refund'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {mode === 'provider'
                ? 'This calls PayMongo and cannot be undone.'
                : 'This records money you have already sent. It does not move any money itself, and it cannot be undone.'}
            </p>

            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Amount (₱)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPesos}
              onChange={(e) => setAmountPesos(e.target.value)}
              disabled={isPending}
              className="w-full text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400 mb-4">
              Order total {formatCentavos(order.total_centavos)}.{' '}
              {!amountValid && amountPesos !== '' && (
                <span className="text-red-600">
                  Enter an amount above ₱0 and no more than the order total.
                </span>
              )}
            </p>

            {mode === 'manual' && (
              <>
                <label
                  htmlFor="refund-note"
                  className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5"
                >
                  How it was sent
                </label>
                <textarea
                  id="refund-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  placeholder="e.g. BPI transfer ref 998877, or GCash to 0917…"
                  className="w-full text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
                />
                <p className="text-xs text-slate-400 mb-4">
                  Admin logins are shared, so this note is the only record of who
                  authorised the refund. Worth filling in.
                </p>
              </>
            )}

            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-4">
              Stock for every item on this order will be restored, whatever amount you
              refund.
            </p>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !amountValid}
                className="text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending
                  ? 'Processing…'
                  : mode === 'provider'
                    ? 'Confirm refund'
                    : 'Record refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
