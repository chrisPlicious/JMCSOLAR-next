'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { DbBooking } from '@/lib/firebase/types';
import { BookingDetails } from './BookingDetails';

type Props = {
  open: boolean;
  booking: DbBooking | null;
  loading?: boolean;
  onClose: () => void;
};

/**
 * Right-side slide-in drawer for booking details. Smoothly animates open/close
 * (backdrop fade + panel translate) and keeps its content mounted until the
 * close transition finishes, so the slide-out isn't cut short.
 */
export function BookingDrawer({ open, booking, loading, onClose }: Props) {
  const [render, setRender] = useState(open); // mounted in the DOM?
  const [shown, setShown] = useState(false);  // animated-in state (drives transforms)

  // Mount immediately when opening.
  useEffect(() => {
    if (open) setRender(true);
  }, [open]);

  // Trigger the enter animation on the frame after mount; reverse on close.
  useEffect(() => {
    if (render && open) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    if (!open) setShown(false);
  }, [render, open]);

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Booking details"
        onTransitionEnd={() => { if (!open) setRender(false); }}
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${shown ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Booking Details</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading || !booking ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-navy-700 rounded-full animate-spin" />
            </div>
          ) : (
            <BookingDetails booking={booking} />
          )}
        </div>
      </div>
    </div>
  );
}
