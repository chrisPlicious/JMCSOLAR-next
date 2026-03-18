'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProductAction } from '../actions';
import Link from 'next/link';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function NewProductForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProductAction, {});

  useEffect(() => {
    if (state?.success) router.push('/admin/products');
  }, [state, router]);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
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
        <h1 className="font-display font-black text-navy-950 text-2xl">New Product</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-2xl">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Basic Information
          </p>

          <div>
            <label className={labelCls}>
              Name <span className="text-red-400">*</span>
            </label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Brand</label>
            <input name="brand" className={inputCls} />
          </div>

          <hr className="border-slate-100 my-6" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Classification
          </p>

          <div>
            <label className={labelCls}>
              Category <span className="text-red-400">*</span>
            </label>
            <select name="category" required className={inputCls}>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Related Service</label>
            <select name="related_service" className={inputCls}>
              <option value="">None</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-slate-100 my-6" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Details
          </p>

          <div>
            <label className={labelCls}>Specs</label>
            <input
              name="specs"
              placeholder="e.g. 550W · Mono PERC"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={4} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Badge</label>
            <input name="badge" placeholder="e.g. Best Seller" className={inputCls} />
          </div>

          <hr className="border-slate-100 my-6" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Media
          </p>

          <div>
            <label className={labelCls}>Product Image</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-solar-500/10 file:text-solar-600 file:font-medium hover:file:bg-solar-500/20 file:cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-solar-500 hover:bg-solar-600 disabled:opacity-60 text-navy-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {isPending ? 'Creating…' : 'Create Product'}
            </button>
            <Link
              href="/admin/products"
              className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
