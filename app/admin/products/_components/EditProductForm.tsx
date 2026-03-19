'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProductAction } from '../actions';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  specs: string | null;
  description: string | null;
  badge: string | null;
  related_service: string | null;
  image_path: string | null;
};

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function EditProductForm({
  product,
  imageUrl,
}: {
  product: Product;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const updateWithId = updateProductAction.bind(null, product.id);
  const [state, formAction, isPending] = useActionState(updateWithId, {});

  useEffect(() => {
    if (state?.success) {
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } else if (state?.error) {
      toast.error(state.error);
    }
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
        <h1 className="font-display font-black text-navy-950 text-2xl">Edit Product</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 max-w-3xl mb-24">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form id="main-form" action={formAction} className="space-y-5">
          {/* Section: Basic Information */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Basic Information
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>
              Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={product.name}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Brand</label>
            <input
              name="brand"
              defaultValue={product.brand ?? ''}
              className={inputCls}
            />
          </div>

          {/* Section: Classification */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Classification
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>
              Category <span className="text-red-400">*</span>
            </label>
            <select
              name="category"
              required
              defaultValue={product.category}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Related Service</label>
            <select
              name="related_service"
              defaultValue={product.related_service ?? ''}
              className={inputCls}
            >
              <option value="">None</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Section: Details */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Details
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>Specs</label>
            <input
              name="specs"
              placeholder="e.g. 550W · Mono PERC"
              defaultValue={product.specs ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={product.description ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Badge</label>
            <input
              name="badge"
              placeholder="e.g. Best Seller"
              defaultValue={product.badge ?? ''}
              className={inputCls}
            />
          </div>

          {/* Section: Media */}
          <div className="flex items-center gap-3 my-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Media
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          {imageUrl && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Current image</p>
              <img
                src={imageUrl}
                alt={product.name}
                className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-slate-50 p-2"
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Product Image</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-solar-500/10 file:text-solar-600 file:font-medium hover:file:bg-solar-500/20 file:cursor-pointer"
            />
          </div>
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/products"
          className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          form="main-form"
          disabled={isPending}
          className="bg-solar-500 hover:bg-solar-400 disabled:opacity-60 text-navy-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {isPending ? 'Saving…' : 'Update Product'}
        </button>
      </div>
    </>
  );
}
