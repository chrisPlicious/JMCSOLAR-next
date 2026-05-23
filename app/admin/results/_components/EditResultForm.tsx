'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { updateResultAction } from '../actions';
import SingleImageUploader from './SingleImageUploader';
import type { BillResult } from '@/types';

interface Props {
  result: BillResult;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function EditResultForm({ result, beforeImageUrl, afterImageUrl }: Props) {
  const boundAction = updateResultAction.bind(null, result.id);
  const [state, formAction, isPending] = useActionState(boundAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success('Result updated');
      router.push('/admin/results');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/results" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-display font-black text-navy-950 text-2xl">Edit Result</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 max-w-3xl mb-24">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form id="main-form" action={formAction} className="space-y-6">
          <input type="hidden" name="existing_before_path" value={result.before_image_path} />
          <input type="hidden" name="existing_after_path" value={result.after_image_path} />

          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Bill Photos
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Before</label>
              <p className="text-xs text-slate-400 mb-3">Hover image to replace</p>
              <SingleImageUploader name="before_image" currentUrl={beforeImageUrl} />
            </div>
            <div>
              <label className={labelCls}>After</label>
              <p className="text-xs text-slate-400 mb-3">Hover image to replace</p>
              <SingleImageUploader name="after_image" currentUrl={afterImageUrl} />
            </div>
          </div>

        </form>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link href="/admin/results" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
          Cancel
        </Link>
        <button
          type="submit"
          form="main-form"
          disabled={isPending}
          className="bg-solar-500 hover:bg-solar-400 disabled:opacity-60 text-navy-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
