'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sun,
  Battery,
  Zap,
  SlidersHorizontal,
  Shuffle,
  ArrowRight,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import type { Product, ProductCategory } from '@/types';

const productCategories: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'All Products'      },
  { id: 'panels',      label: 'Solar Panels'       },
  { id: 'batteries',   label: 'Batteries'          },
  { id: 'inverters',   label: 'Inverters'          },
  { id: 'controllers', label: 'Charge Controllers' },
  { id: 'converters',  label: 'Converters'         },
];

const categoryIcon: Record<ProductCategory, (size: number) => React.ReactNode> = {
  panels:      (s) => <Sun size={s} strokeWidth={1.2} />,
  batteries:   (s) => <Battery size={s} strokeWidth={1.2} />,
  inverters:   (s) => <Zap size={s} strokeWidth={1.2} />,
  controllers: (s) => <SlidersHorizontal size={s} strokeWidth={1.2} />,
  converters:  (s) => <Shuffle size={s} strokeWidth={1.2} />,
};

function ProductCard({ product, index }: { product: Product; index: number }) {
  const number = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="text-[13px] text-slate-400 font-medium mb-2.5 block tracking-wider">
        {number}
      </span>

      <div
        className="relative rounded-[1.4rem] overflow-hidden group-hover:-translate-y-1 transition-all duration-300"
        style={{ backgroundColor: '#e5e0d8' }}
      >
        <div className="aspect-[3/4] flex items-center justify-center p-8">
          {product.image_path ? (
            <img
              src={product.image_path}
              alt={product.name}
              className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="text-navy-800/25 group-hover:text-navy-800/40 group-hover:scale-110 transition-all duration-500">
              {categoryIcon[product.category as keyof typeof categoryIcon]?.(72)}
            </div>
          )}
        </div>

        {product.badge && (
          <span className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-[0.12em] bg-white/90 backdrop-blur-sm text-navy-900 px-3 py-1.5 rounded-full">
            {product.badge}
          </span>
        )}

        <a
          href={`/?product=${product.id}&service=${product.related_service}#contact`}
          className="absolute bottom-4 right-4 w-11 h-11 bg-navy-900 hover:bg-solar-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
          aria-label={`Inquire about ${product.name}`}
        >
          <ArrowUpRight size={17} className="text-white" />
        </a>
      </div>

      <div className="mt-4">
        <h3
          className="text-navy-900 font-bold text-[15px] leading-snug mb-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {product.name}
        </h3>
        <p className="text-slate-400 text-[12px] leading-relaxed">{product.specs}</p>
      </div>
    </motion.div>
  );
}

interface Props {
  products: Product[];
}

export default function ProductsPage({ products }: Props) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <Layout>
      {/* Hero */}
      <motion.div
        className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 pt-28 pb-14 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Products</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Package size={28} className="text-white" />
              </div>
            </div>

            <h1
              className="text-white font-black text-4xl sm:text-5xl leading-tight mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Our Products
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl">
              Quality solar equipment sourced from trusted global brands — panels,
              batteries, inverters, charge controllers, and more.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <p className="text-[13px] text-slate-400 uppercase tracking-[0.2em] font-medium">Our Products</p>
          <h2
            className="text-navy-900 font-bold text-2xl sm:text-[1.75rem] max-w-sm leading-snug"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            We offer a range of quality solar products to choose&nbsp;from.
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-12">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {productCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat.id).length;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ProductCategory | 'all')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-navy-900 border-navy-900 text-white'
                      : 'bg-white border-slate-200 text-navy-900 hover:border-navy-300'
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  {cat.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
            >
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-slate-400"
            >
              <Package size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No products in this category yet.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="mt-24 bg-navy-900 rounded-3xl px-5 py-10 sm:px-10 sm:py-14 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-white font-black text-2xl sm:text-3xl mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Not sure which product fits your system?
          </h2>
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Our team will assess your site and recommend the right equipment for your budget and energy needs — free of charge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/#contact" className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors duration-200">
              Get a Free Consultation <ArrowRight size={18} />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition-colors duration-200 text-sm">
              View our services →
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
