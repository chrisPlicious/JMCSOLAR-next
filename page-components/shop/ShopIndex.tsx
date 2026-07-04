'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Store } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ShopItemCard from '@/components/shop/ShopItemCard';
import type { ShopCardItem } from '@/lib/shop/display';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'lights', label: 'Lights' },
  { id: 'wires', label: 'Wires' },
  { id: 'accessories', label: 'Accessories' },
];

interface Props {
  items: ShopCardItem[];
  initialQuery: string;
  initialCategory: string;
  counts: Record<string, number>;
}

export default function ShopIndex({ items, initialQuery, initialCategory, counts }: Props) {
  const [category, setCategory] = useState(initialCategory);
  // `input` is what's typed; `query` is what's actually applied (on Enter / submit).
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  const term = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === 'all' || i.category === category) &&
          (term === '' || i.searchText.includes(term)),
      ),
    [items, category, term],
  );

  function applySearch(e: FormEvent) {
    e.preventDefault();
    setQuery(input);
  }

  function clearSearch() {
    setInput('');
    setQuery('');
  }

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
          <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Shop</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
          </div>

          <h1
            className="text-white font-black text-4xl sm:text-5xl leading-tight mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Shop
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mb-8">
            Solar lights, PV wires, and accessories — buy online with guest checkout,
            nationwide delivery, and free store pickup in Ormoc City.
          </p>

          {/* Live search — filters in place on Enter; no page reload (#8) */}
          <form onSubmit={applySearch} className="max-w-xl">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Clearing the box (incl. the native ✕) restores the full list immediately.
                  if (e.target.value === '') setQuery('');
                }}
                placeholder="Search items or SKU, then press Enter…"
                aria-label="Search shop items"
                className="w-full bg-white/95 backdrop-blur rounded-full pl-11 pr-28 py-3.5 text-sm text-navy-950 outline-none focus:ring-2 focus:ring-solar-500/40 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-5 py-2 rounded-full transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Category pills — filter instantly, no navigation (#1) */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-12">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-navy-900 border-navy-900 text-white'
                      : 'bg-white border-slate-200 text-navy-900 hover:border-navy-300'
                  }`}
                >
                  {cat.label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {counts[cat.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active query notice */}
        {term && (
          <div className="mb-8 flex items-center gap-3 text-sm text-slate-500">
            <span>
              {filtered.length} result{filtered.length === 1 ? '' : 's'} for{' '}
              <span className="font-semibold text-navy-900">“{query}”</span>
            </span>
            <button onClick={clearSearch} className="text-solar-600 hover:text-solar-500 font-semibold">
              Clear
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filtered.map((item, i) => (
              <ShopItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">
              {term ? 'No items match your search.' : 'No items in this category yet.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
