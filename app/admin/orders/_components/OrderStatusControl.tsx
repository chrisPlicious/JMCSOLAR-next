'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { DbOrderStatus } from '@/lib/firebase/types';
import { updateOrderStatusAction } from '../actions';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from './order-meta';

export function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: DbOrderStatus;
}) {
  const [status, setStatus] = useState<DbOrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: DbOrderStatus) {
    if (next === status) return;
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, next);
      if (res.error) {
        setStatus(previous);
        toast.error(res.error);
      } else {
        toast.success(`Status updated to ${ORDER_STATUS_LABELS[next]}.`);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as DbOrderStatus)}
        disabled={isPending}
        className="text-sm font-medium text-navy-900 border border-slate-200 bg-white rounded-xl px-3 py-2 transition-colors hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">Saving…</span>}
    </div>
  );
}
