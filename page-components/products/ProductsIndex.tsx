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
  ArrowUpRight,
  Package,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardVariants } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import CtaBand from '@/components/ui/CtaBand';
import EmptyState from '@/components/ui/EmptyState';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';
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
  panels:      (s) => <Sun size={s} strokeWidth={1.2} aria-hidden />,
  batteries:   (s) => <Battery size={s} strokeWidth={1.2} aria-hidden />,
  inverters:   (s) => <Zap size={s} strokeWidth={1.2} aria-hidden />,
  controllers: (s) => <SlidersHorizontal size={s} strokeWidth={1.2} aria-hidden />,
  converters:  (s) => <Shuffle size={s} strokeWidth={1.2} aria-hidden />,
};

function ProductCard({ product, index }: { product: Product; index: number }) {
  // Link to the detail page once the product has a slug (backfilled); until then fall
  // back to the inquiry deep-link so nothing breaks pre-backfill.
  const detailHref = product.slug ? `/products/${product.slug}` : null;
  const href = detailHref ?? `/?product=${product.id}&service=${product.related_service}#contact`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: EASE_OUT }}
    >
      <Link
        href={href}
        aria-label={detailHref ? undefined : `Inquire about ${product.name}`}
        className={cn(cardVariants({ variant: 'interactive' }), 'group flex h-full flex-col p-3')}
      >
        <div className="relative overflow-hidden rounded-card bg-navy-50">
          <div className="aspect-[3/4] flex items-center justify-center p-8">
            {product.image_path ? (
              <img
                src={product.image_path}
                alt={product.name}
                className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out-quart group-hover:scale-105"
              />
            ) : (
              <div className="text-navy-800/25 transition-colors duration-300 group-hover:text-navy-800/40">
                {categoryIcon[product.category as keyof typeof categoryIcon]?.(72)}
              </div>
            )}
          </div>

          {product.badge && (
            <Badge tone="solar" caps className="absolute top-3 left-3">
              {product.badge}
            </Badge>
          )}

          <span
            className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-navy-900 text-white shadow-soft transition-colors duration-300 group-hover:bg-solar-500 group-hover:text-navy-950"
            aria-hidden
          >
            <ArrowUpRight size={17} />
          </span>
        </div>

        <div className="px-2 pt-4 pb-2">
          <h3 className="text-title text-fg transition-colors group-hover:text-solar-ink">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-fg-subtle tabular-nums">{product.specs}</p>
        </div>
      </Link>
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
      <PageHero
        title="Our Products"
        lead="Quality solar equipment sourced from trusted global brands — panels, batteries, inverters, charge controllers, and more."
      />

      <Section tone="white">
        <SectionHeader title="We offer a range of quality solar products to choose from." />

        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-12">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap" role="group" aria-label="Filter by category">
            {productCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(cat.id as ProductCategory | 'all')}
                  className={cn(
                    'flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'border-navy-950 bg-navy-950 text-white'
                      : 'border-line bg-white text-fg hover:border-navy-300',
                  )}
                >
                  {cat.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-fg-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
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
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
            >
              <EmptyState icon={Package} title="No products in this category yet." />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <CtaBand
        className="pt-0 sm:pt-0"
        title="Not sure which product fits your system?"
        body="Our team will assess your site and recommend the right equipment for your budget and energy needs — free of charge."
      />
    </Layout>
  );
}
