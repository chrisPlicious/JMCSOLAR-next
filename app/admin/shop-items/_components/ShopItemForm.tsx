'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { createShopItemAction, updateShopItemAction } from '../actions';
import ImageDropzone from './ImageDropzone';
import type { DbShopItem } from '@/lib/firebase/types';

const categories = ['lights', 'wires', 'accessories'];

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-colors';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';
const sectionCls = 'flex items-center gap-3 my-6';
const sectionLabelCls =
  'text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap';

type VariantRow = { id: string; label: string; sku: string; price: string; stock: string };

function centavosToPesos(centavos: number): string {
  return (centavos / 100).toString();
}

export default function ShopItemForm({
  item,
  imageUrl,
}: {
  item?: DbShopItem;
  imageUrl?: string | null;
}) {
  const isEdit = Boolean(item);
  const router = useRouter();

  const action = isEdit
    ? updateShopItemAction.bind(null, item!.id)
    : createShopItemAction;
  const [state, formAction, isPending] = useActionState(action, {});

  const [variants, setVariants] = useState<VariantRow[]>(
    item?.variants?.map((v) => ({
      id: v.id,
      label: v.label,
      sku: v.sku,
      price: centavosToPesos(v.price_centavos),
      stock: v.stock.toString(),
    })) ?? [],
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? 'Shop item updated' : 'Shop item created');
      router.push('/admin/shop-items');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  function addVariant() {
    setVariants((rows) => [...rows, { id: '', label: '', sku: '', price: '', stock: '' }]);
  }
  function removeVariant(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }
  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/shop-items"
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
          {isEdit ? 'Edit Shop Item' : 'New Shop Item'}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 max-w-3xl mb-24">
        {state?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <form id="main-form" action={formAction} className="space-y-5">
          {/* Variants serialized to a hidden input (server parses + validates). */}
          <input type="hidden" name="variants" value={JSON.stringify(variants)} />

          {/* Section: Basic Information */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>Basic Information</span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>
              Name <span className="text-red-400">*</span>
            </label>
            <input name="name" required defaultValue={item?.name ?? ''} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input
              name="slug"
              defaultValue={item?.slug ?? ''}
              placeholder="auto-generated from name if left blank"
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">
              Used in the storefront URL (/shop/&lt;slug&gt;). Must be unique.
            </p>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={item?.description ?? ''}
              className={inputCls}
            />
          </div>

          {/* Section: Classification */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>Classification</span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                required
                defaultValue={item?.category ?? 'lights'}
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
              <label className={labelCls}>
                SKU <span className="text-red-400">*</span>
              </label>
              <input name="sku" required defaultValue={item?.sku ?? ''} className={inputCls} />
            </div>
          </div>

          {/* Section: Pricing & Stock */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>Pricing &amp; Stock</span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Price (₱) <span className="text-red-400">*</span>
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={item ? centavosToPesos(item.price) : ''}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-1">Base price. Overridden per variant below, if any.</p>
            </div>
            <div>
              <label className={labelCls}>
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={item?.stock ?? ''}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-1">Base stock. Used when there are no variants.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Low-stock threshold</label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                step="1"
                defaultValue={item?.low_stock_threshold ?? ''}
                placeholder="blank = default (5)"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Weight (grams)</label>
              <input
                name="weight_grams"
                type="number"
                min="0"
                step="1"
                defaultValue={item?.weight_grams ?? ''}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              name="active"
              type="checkbox"
              defaultChecked={item ? item.active : true}
              className="w-4 h-4 rounded border-slate-300 text-solar-500 focus:ring-solar-500/30"
            />
            <span className="text-sm font-medium text-slate-700">
              Active (visible in the storefront)
            </span>
          </label>

          {/* Section: Variants (#9) */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>Variants</span>
            <hr className="flex-1 border-slate-100" />
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            Optional. Add variants (e.g. 100W / Warm White / 5m) for per-option price &amp; stock.
            When present, the base price/stock are ignored at purchase.
          </p>

          {variants.length > 0 && (
            <div className="space-y-3">
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_7rem_5rem_2rem] gap-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Label</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SKU</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price (₱)</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock</span>
                <span />
              </div>
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_7rem_5rem_2rem] gap-2 items-center"
                >
                  <input
                    aria-label="Variant label"
                    value={v.label}
                    onChange={(e) => updateVariant(i, 'label', e.target.value)}
                    placeholder="100W"
                    className={inputCls}
                  />
                  <input
                    aria-label="Variant SKU"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    placeholder="SKU-100W"
                    className={inputCls}
                  />
                  <input
                    aria-label="Variant price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.price}
                    onChange={(e) => updateVariant(i, 'price', e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                  <input
                    aria-label="Variant stock"
                    type="number"
                    min="0"
                    step="1"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    aria-label="Remove variant"
                    className="text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addVariant}
            className="text-sm font-semibold text-solar-600 hover:text-solar-500 transition-colors"
          >
            + Add variant
          </button>

          {/* Section: SEO (#5) */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>SEO</span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>Meta title</label>
            <input
              name="meta_title"
              defaultValue={item?.meta_title ?? ''}
              placeholder="falls back to the item name"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Meta description</label>
            <textarea
              name="meta_description"
              rows={2}
              defaultValue={item?.meta_description ?? ''}
              placeholder="falls back to the description"
              className={inputCls}
            />
          </div>

          {/* Section: Media */}
          <div className={sectionCls}>
            <span className={sectionLabelCls}>Media</span>
            <hr className="flex-1 border-slate-100" />
          </div>

          <div>
            <label className={labelCls}>
              Item Image <span className="text-red-400">*</span>
            </label>
            <ImageDropzone required currentImageUrl={imageUrl ?? null} />
          </div>
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/shop-items"
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
          {isPending ? 'Saving…' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </>
  );
}
