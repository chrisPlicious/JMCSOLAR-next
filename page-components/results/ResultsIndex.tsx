'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { BillResult } from '@/types';
import Layout from '@/components/layout/Layout';

type ResultWithUrls = BillResult & { beforeUrl: string; afterUrl: string };
type LightboxState = { result: ResultWithUrls } | null;

interface Props {
  results: ResultWithUrls[];
}

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, onClose]);

  useEffect(() => {
    document.body.style.overflow = state ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [state]);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/50 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              <span>Close</span>
              <span className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            {/* Labels */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  Before
                </span>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  After
                </span>
              </div>
            </div>

            {/* Images side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black/30 ring-1 ring-red-500/20">
                <Image
                  src={state.result.beforeUrl}
                  alt="Before switching to solar"
                  fill
                  sizes="(max-width: 768px) 46vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black/30 ring-1 ring-green-500/20">
                <Image
                  src={state.result.afterUrl}
                  alt="After switching to solar"
                  fill
                  sizes="(max-width: 768px) 46vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <p className="text-center text-white/25 text-xs mt-4">Click outside or press Esc to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultCard({
  result,
  index,
  onOpen,
}: {
  result: ResultWithUrls;
  index: number;
  onOpen: (result: ResultWithUrls) => void;
}) {
  const isReversed = index % 2 !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col sm:flex-row items-center gap-8 sm:gap-12 lg:gap-16 ${
        isReversed ? 'sm:flex-row-reverse' : ''
      }`}
    >
      {/* Image Side */}
      <div className="w-full sm:w-1/2 shrink-0">
        <button
          onClick={() => onOpen(result)}
          className="group block w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {/* Header strip */}
          <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Customer #{index + 1}
            </span>
            <div className="flex-1" />
            <span className="text-[10px] text-gray-300 uppercase tracking-wider hidden sm:block transition-colors group-hover:text-amber-500">tap to expand</span>
          </div>

          {/* Images — edge to edge, tight gap */}
          <div className="grid grid-cols-2 gap-1 p-1">
            {/* Before */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={result.beforeUrl}
                alt="Before solar"
                fill
                sizes="(max-width: 640px) 90vw, 40vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/85 text-white backdrop-blur-sm leading-none">
                Before
              </span>
            </div>

            {/* After */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={result.afterUrl}
                alt="After solar"
                fill
                sizes="(max-width: 640px) 90vw, 40vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/85 text-white backdrop-blur-sm leading-none">
                After
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Content Side */}
      <div className="flex flex-col gap-4 w-full sm:w-1/2">
        <h3 className="text-slate-900 font-bold text-2xl sm:text-3xl lg:text-4xl leading-snug" style={{ fontFamily: "Poppins, sans-serif" }}>
          Customer Result #{index + 1}
        </h3>
        <p className="text-slate-600 text-xl sm:text-xl leading-relaxed">
          {result.description || "This customer switched to solar and saw a significant reduction in their monthly electric bill. Our tailored solar solutions ensure maximum efficiency and long-term savings."}
        </p>
        {/* Accent underline */}
        <div className="w-12 h-1 rounded-full mt-2 bg-amber-400" />
      </div>
    </motion.div>
  );
}

export default function ResultsIndex({ results }: Props) {
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const openLightbox = useCallback((result: ResultWithUrls) => setLightbox({ result }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <Layout>
      <Lightbox state={lightbox} onClose={closeLightbox} />

      {/* Dot-grid bg */}
      <div className="min-h-screen bg-white relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 75% 60% at 50% 10%, black 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 10%, black 20%, transparent 100%)',
          }}
        />

        {/* Hero */}
        <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-5">
              Real Results
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gray-900 leading-tight mb-4">
              See the Difference
            </h1>
            <p className="text-gray-500 text-lg">
              Real electric bills from our customers — before and after switching to solar.
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {results.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-gray-300">
                  <rect x="2" y="2" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 2v24M2 14h24" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">No results yet. Check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-16 sm:gap-24">
              {results.map((result, i) => (
                <ResultCard key={result.id} result={result} index={i} onOpen={openLightbox} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
