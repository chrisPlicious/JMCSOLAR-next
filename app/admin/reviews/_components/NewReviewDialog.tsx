'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createReviewFromDialog } from '../actions';

const SOURCE_OPTIONS = ['google', 'facebook', 'instagram', 'direct', 'other'] as const;

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function NewReviewDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const [state, dispatch, isPending] = useActionState(createReviewFromDialog, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && state === null && !isPending) {
      submitted.current = false;
      setOpen(false);
      setRating(5);
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, isPending, router]);

  function handleSubmit() {
    submitted.current = true;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
      >
        + New Review
      </DialogTrigger>

      <DialogContent className="max-w-lg p-0 gap-0 rounded-2xl border border-slate-100 shadow-[0_24px_80px_0_rgb(0_0_0/0.18)]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="font-display font-black text-navy-950 text-xl">
            New Review
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={dispatch} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Reviewer Name <span className="text-red-400">*</span>
            </label>
            <input name="reviewer_name" required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>
              Source <span className="text-red-400">*</span>
            </label>
            <select name="source" required defaultValue="google" className={inputCls}>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hovered ?? rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill={filled ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={filled ? 'text-solar-500' : 'text-slate-300'}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-slate-500">{rating} / 5</span>
            </div>
            <input type="hidden" name="rating" value={rating} />
          </div>

          <div>
            <label className={labelCls}>
              Quote <span className="text-red-400">*</span>
            </label>
            <textarea name="quote" required rows={3} className={inputCls} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-solar-500 hover:bg-solar-400 disabled:opacity-60 text-navy-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {isPending ? 'Saving…' : 'Create Review'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
