'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DbReview } from '@/lib/supabase/types';

const SOURCE_OPTIONS = ['google', 'facebook', 'instagram', 'direct', 'other'] as const;

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

type ReviewFormProps = {
  review?: DbReview;
  action: (fd: FormData) => Promise<void>;
};

export default function ReviewForm({ review, action }: ReviewFormProps) {
  const isEdit = Boolean(review);
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/reviews"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path
              d="M12 15l-5-5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="font-display font-black text-navy-950 text-2xl">
          {isEdit ? 'Edit Review' : 'New Review'}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-3xl mb-24">
        <form id="main-form" action={action} className="space-y-5">
          {/* Section: Review Info */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Review Info
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>
              Reviewer Name <span className="text-red-400">*</span>
            </label>
            <input
              name="reviewer_name"
              required
              defaultValue={review?.reviewer_name ?? ''}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Source <span className="text-red-400">*</span>
            </label>
            <select
              name="source"
              required
              defaultValue={review?.source ?? 'google'}
              className={inputCls}
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
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
                      width="28"
                      height="28"
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
            <textarea
              name="quote"
              required
              rows={4}
              defaultValue={review?.quote ?? ''}
              className={inputCls}
            />
          </div>
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/reviews"
          className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          form="main-form"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {isEdit ? 'Update Review' : 'Create Review'}
        </button>
      </div>
    </>
  );
}
