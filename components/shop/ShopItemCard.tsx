'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { ShopCardItem } from '@/lib/shop/display';
import { useCart } from './CartContext';

export default function ShopItemCard({ item, index }: { item: ShopCardItem; index: number }) {
  const { addItem } = useCart();
  const outOfStock = item.stock <= 0;

  function handleAdd() {
    addItem({
      shopItemId: item.id,
      variantId: null,
      name: item.name,
      variantLabel: null,
      sku: item.sku,
      slug: item.slug,
      unitPriceCentavos: item.priceCentavos,
      imageUrl: item.imageUrl,
      maxStock: item.stock,
    });
    toast.success(
      <span className="flex items-center gap-2">
        <Check size={15} className="text-green-600" /> Added {item.name} to cart
      </span>,
    );
  }

  return (
    <motion.div
      className="group flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/shop/${item.slug}`} className="block">
        <div
          className="relative rounded-[1.4rem] overflow-hidden group-hover:-translate-y-1 transition-all duration-300"
          style={{ backgroundColor: '#e5e0d8' }}
        >
          <div className="aspect-square flex items-center justify-center p-8">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-navy-800/25 group-hover:text-navy-800/40 group-hover:scale-110 transition-all duration-500">
                <Package size={64} strokeWidth={1.2} />
              </div>
            )}
          </div>

          {outOfStock && (
            <span className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-[0.12em] bg-navy-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-col flex-1">
        <Link href={`/shop/${item.slug}`}>
          <h3
            className="text-navy-900 font-bold text-[15px] leading-snug mb-1 group-hover:text-solar-600 transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {item.name}
          </h3>
        </Link>
        <p className="text-slate-400 text-[12px] font-mono mb-2">{item.sku}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-navy-900 font-black text-lg">
            {item.hasVariants && (
              <span className="text-[11px] font-semibold text-slate-400 mr-1">from</span>
            )}
            {formatCentavos(item.priceFromCentavos)}
          </span>

          {item.hasVariants ? (
            <Link
              href={`/shop/${item.slug}`}
              className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-solar-500 hover:text-navy-950 text-white text-xs font-bold px-3.5 py-2 rounded-full transition-colors"
            >
              Select options
            </Link>
          ) : (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-solar-500 hover:text-navy-950 disabled:opacity-40 disabled:hover:bg-navy-900 disabled:hover:text-white text-white text-xs font-bold px-3.5 py-2 rounded-full transition-colors"
              aria-label={`Add ${item.name} to cart`}
            >
              <ShoppingCart size={14} />
              Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
