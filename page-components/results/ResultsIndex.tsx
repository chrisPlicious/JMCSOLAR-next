'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { BillResult } from '@/types';

interface Props {
  results: (BillResult & { beforeUrl: string; afterUrl: string })[];
}

function ResultCard({
  result,
  index,
}: {
  result: BillResult & { beforeUrl: string; afterUrl: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
      className="bg-navy-900 rounded-2xl overflow-hidden border border-white/6 hover:border-solar-500/25 transition-colors duration-300"
    >
      <div className="grid grid-cols-2">
        {/* Before */}
        <div className="relative">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={result.beforeUrl}
              alt="Before switching to solar"
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover"
            />
          </div>
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/80 text-white backdrop-blur-sm">
            Before
          </span>
        </div>

        {/* Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center shadow-lg pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* After */}
        <div className="relative">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={result.afterUrl}
              alt="After switching to solar"
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover"
            />
          </div>
          <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-green-500/80 text-white backdrop-blur-sm">
            After
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResultsIndex({ results }: Props) {
  return (
    <main className="min-h-screen bg-navy-950">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-solar-400 bg-solar-500/10 px-4 py-1.5 rounded-full mb-5">
            Real Results
          </span>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white leading-tight mb-4">
            See the Difference
          </h1>
          <p className="text-white/60 text-lg">
            Real electric bills from our customers — before and after switching to solar.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {results.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-white/20">
                <rect x="2" y="2" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 2v24M2 14h24" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <p className="text-white/40 font-medium">No results yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((result, i) => (
              <ResultCard key={result.id} result={result} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
