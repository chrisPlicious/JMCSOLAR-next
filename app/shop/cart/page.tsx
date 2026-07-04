'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { formatCentavos } from '@/lib/bookings/pricing';
import { useCart, lineKey } from '@/components/shop/CartContext';

export default function CartPage() {
  const { items, hydrated, updateQuantity, removeItem, subtotalCentavos, totalQuantity } = useCart();

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
            <Link href="/" className="hover:text-navy-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-navy-900 transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-navy-900">Cart</span>
          </div>

          <h1
            className="text-navy-950 font-black text-3xl sm:text-4xl mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Your Cart
          </h1>

          {/* Avoid SSR/CSR flash: render nothing until the cart hydrates. */}
          {!hydrated ? (
            <div className="text-slate-400 text-sm">Loading cart…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={44} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500 mb-6">Your cart is empty.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <ArrowLeft size={18} /> Browse the shop
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
              {/* Lines */}
              <div className="space-y-3">
                {items.map((line) => (
                  <motion.div
                    key={lineKey(line.shopItemId, line.variantId)}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Thumb */}
                    <Link
                      href={`/shop/${line.slug}`}
                      className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: '#e5e0d8' }}
                    >
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt={line.name} className="max-w-full max-h-full object-contain p-1.5" />
                      ) : (
                        <Package size={28} className="text-navy-800/25" />
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${line.slug}`} className="font-bold text-navy-900 text-sm hover:text-solar-600 transition-colors line-clamp-1">
                        {line.name}
                      </Link>
                      {line.variantLabel && (
                        <p className="text-xs text-slate-500 mt-0.5">{line.variantLabel}</p>
                      )}
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{line.sku}</p>
                      <p className="text-sm font-bold text-navy-900 mt-1.5 sm:hidden">
                        {formatCentavos(line.unitPriceCentavos)}
                      </p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(line.shopItemId, line.variantId, line.quantity - 1)}
                        className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-9 text-center text-sm font-bold text-navy-900 select-none">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.shopItemId, line.variantId, line.quantity + 1)}
                        disabled={line.quantity >= line.maxStock}
                        className="px-2.5 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Line total + remove */}
                    <div className="text-right shrink-0 w-24 hidden sm:block">
                      <p className="font-bold text-navy-900 text-sm">
                        {formatCentavos(line.unitPriceCentavos * line.quantity)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(line.shopItemId, line.variantId)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="font-bold text-navy-900 text-lg mb-4">Summary</h2>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Items ({totalQuantity})</span>
                  <span className="font-semibold text-navy-900">{formatCentavos(subtotalCentavos)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="h-px bg-slate-100 mb-4" />
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-navy-900">Subtotal</span>
                  <span className="font-black text-navy-900 text-lg">{formatCentavos(subtotalCentavos)}</span>
                </div>
                <Link
                  href="/shop/checkout"
                  className="w-full inline-flex items-center justify-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3.5 rounded-xl transition-colors"
                >
                  Proceed to checkout <ArrowRight size={18} />
                </Link>
                <Link
                  href="/shop"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-900 transition-colors mt-3"
                >
                  <ArrowLeft size={15} /> Continue shopping
                </Link>
                <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
                  Prices are confirmed at checkout. Stock is re-validated before payment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
