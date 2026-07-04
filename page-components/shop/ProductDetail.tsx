'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Minus, Plus, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { formatCentavos } from '@/lib/bookings/pricing';
import { useCart } from '@/components/shop/CartContext';
import type { DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

const categoryLabels: Record<string, string> = {
  lights: 'Lights',
  wires: 'Wires',
  accessories: 'Accessories',
};

export default function ProductDetail({
  item,
  imageUrl,
}: {
  item: DbShopItem;
  imageUrl: string | null;
}) {
  const { addItem } = useCart();
  const variants = item.variants ?? [];
  const hasVariants = variants.length > 0;

  // Default to the first in-stock variant, else the first variant.
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (!hasVariants) return null;
    return (variants.find((v) => v.stock > 0) ?? variants[0]).id;
  });
  const [qty, setQty] = useState(1);

  const selectedVariant: DbShopItemVariant | null = useMemo(
    () => (hasVariants ? variants.find((v) => v.id === selectedVariantId) ?? null : null),
    [hasVariants, variants, selectedVariantId],
  );

  const unitPriceCentavos = selectedVariant ? selectedVariant.price_centavos : item.price;
  const availableStock = selectedVariant ? selectedVariant.stock : item.stock;
  const outOfStock = availableStock <= 0;
  const sku = selectedVariant ? selectedVariant.sku : item.sku;

  function changeVariant(id: string) {
    setSelectedVariantId(id);
    setQty(1);
  }

  function stepQty(delta: number) {
    setQty((q) => Math.min(Math.max(1, q + delta), Math.max(1, availableStock)));
  }

  function handleAdd() {
    if (outOfStock) return;
    addItem(
      {
        shopItemId: item.id,
        variantId: selectedVariant ? selectedVariant.id : null,
        name: item.name,
        variantLabel: selectedVariant ? selectedVariant.label : null,
        sku,
        slug: item.slug,
        unitPriceCentavos,
        imageUrl,
        maxStock: availableStock,
      },
      qty,
    );
    toast.success(
      <span className="flex items-center gap-2">
        <Check size={15} className="text-green-600" />
        Added {qty} × {item.name}
        {selectedVariant ? ` (${selectedVariant.label})` : ''} to cart
      </span>,
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-8 flex-wrap">
            <Link href="/" className="hover:text-navy-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-navy-900 transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-navy-900">{item.name}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-[1.6rem] overflow-hidden flex items-center justify-center p-10 aspect-square"
              style={{ backgroundColor: '#e5e0d8' }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-xl" />
              ) : (
                <Package size={96} strokeWidth={1} className="text-navy-800/25" />
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-solar-600 bg-solar-500/10 px-3 py-1 rounded-full mb-4">
                {categoryLabels[item.category] ?? item.category}
              </span>

              <h1
                className="text-navy-950 font-black text-3xl sm:text-4xl leading-tight mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {item.name}
              </h1>
              <p className="text-slate-400 text-sm font-mono mb-5">{sku}</p>

              <p className="text-navy-900 font-black text-3xl mb-6">{formatCentavos(unitPriceCentavos)}</p>

              {item.description && (
                <p className="text-slate-600 text-[15px] leading-relaxed mb-7">{item.description}</p>
              )}

              {/* Variant selector (#9) */}
              {hasVariants && (
                <div className="mb-7">
                  <p className="text-sm font-semibold text-navy-900 mb-2.5">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSelected = v.id === selectedVariantId;
                      const vOut = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          onClick={() => changeVariant(v.id)}
                          disabled={vOut}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                            isSelected
                              ? 'bg-navy-900 border-navy-900 text-white'
                              : vOut
                                ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                                : 'bg-white border-slate-200 text-navy-900 hover:border-navy-400'
                          }`}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock line */}
              <p className="text-sm mb-5">
                {outOfStock ? (
                  <span className="font-semibold text-red-500">Out of stock</span>
                ) : availableStock <= 5 ? (
                  <span className="font-semibold text-amber-600">Only {availableStock} left</span>
                ) : (
                  <span className="font-semibold text-green-600">In stock</span>
                )}
              </p>

              {/* Quantity + add */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => stepQty(-1)}
                    disabled={outOfStock || qty <= 1}
                    className="px-3.5 py-3 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-navy-900 select-none">{qty}</span>
                  <button
                    onClick={() => stepQty(1)}
                    disabled={outOfStock || qty >= availableStock}
                    className="px-3.5 py-3 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={outOfStock}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-solar-500 hover:bg-solar-400 disabled:opacity-40 text-navy-950 font-bold px-6 py-3.5 rounded-xl transition-colors"
                >
                  <ShoppingCart size={18} />
                  {outOfStock ? 'Unavailable' : 'Add to cart'}
                </button>
              </div>

              <Link
                href="/shop/cart"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900 transition-colors mt-5"
              >
                View cart <ArrowRight size={15} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
