'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ReceiptText, X } from 'lucide-react';
import type { BillResult } from '@/types';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CtaBand from '@/components/ui/CtaBand';
import EmptyState from '@/components/ui/EmptyState';
import { cardVariants } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { DURATION, EASE_OUT, fadeUp, revealOnScroll } from '@/lib/motion';
import { cn } from '@/lib/utils';

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
          transition={{ duration: DURATION.fast }}
          role="dialog"
          aria-modal="true"
          aria-label="Before and after electric bills"
          className="surface-dark fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-navy-950/95 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20"
            >
              <X className="size-5" aria-hidden />
            </Button>

            {/* Labels */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex justify-center">
                <Badge tone="danger" caps>Before</Badge>
              </div>
              <div className="flex justify-center">
                <Badge tone="success" caps>After</Badge>
              </div>
            </div>

            {/* Images side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] w-full rounded-card overflow-hidden bg-navy-900">
                <Image
                  src={state.result.beforeUrl}
                  alt="Before switching to solar"
                  fill
                  sizes="(max-width: 768px) 46vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative aspect-[3/4] w-full rounded-card overflow-hidden bg-navy-900">
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

            <p className="text-center text-fg-subtle text-xs mt-4">Click outside or press Esc to close</p>
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
      variants={fadeUp}
      {...revealOnScroll}
      className={`flex flex-col sm:flex-row items-center gap-8 sm:gap-12 lg:gap-16 ${
        isReversed ? 'sm:flex-row-reverse' : ''
      }`}
    >
      {/* Image Side */}
      <div className="w-full sm:w-1/2 shrink-0">
        <button
          type="button"
          onClick={() => onOpen(result)}
          aria-label={`Enlarge before and after bills for customer ${index + 1}`}
          className={cn(
            cardVariants({ variant: 'interactive' }),
            'group block w-full overflow-hidden text-left cursor-pointer',
          )}
        >
          {/* Header strip */}
          <div className="bg-slate-50 px-4 py-2.5 flex items-center gap-2 border-b border-line">
            <span className="caps">Customer {index + 1}</span>
            <div className="flex-1" />
            <span className="hidden sm:flex items-center gap-1 text-xs text-fg-subtle transition-colors group-hover:text-solar-ink">
              <Maximize2 className="size-3.5" aria-hidden />
              Tap to expand
            </span>
          </div>

          {/* Images — edge to edge, tight gap */}
          <div className="grid grid-cols-2 gap-1 p-1">
            {/* Before */}
            <div className="relative aspect-[3/4] rounded-control overflow-hidden bg-slate-100">
              <Image
                src={result.beforeUrl}
                alt="Before solar"
                fill
                sizes="(max-width: 640px) 90vw, 40vw"
                className="object-cover transition-transform duration-500 ease-out-quart group-hover:scale-[1.03]"
              />
              <Badge tone="danger" caps className="absolute top-2 left-2">Before</Badge>
            </div>

            {/* After */}
            <div className="relative aspect-[3/4] rounded-control overflow-hidden bg-slate-100">
              <Image
                src={result.afterUrl}
                alt="After solar"
                fill
                sizes="(max-width: 640px) 90vw, 40vw"
                className="object-cover transition-transform duration-500 ease-out-quart group-hover:scale-[1.03]"
              />
              <Badge tone="success" caps className="absolute top-2 right-2">After</Badge>
            </div>
          </div>
        </button>
      </div>

      {/* Content Side */}
      <div className="flex flex-col gap-4 w-full sm:w-1/2">
        <h2 className="text-h3 text-fg">Customer result #{index + 1}</h2>
        <p className="text-lead text-fg-muted">
          {result.description || "This customer switched to solar and saw a significant reduction in their monthly electric bill. Our tailored solar solutions ensure maximum efficiency and long-term savings."}
        </p>
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

      <PageHero
        title="See the Difference Solar Makes"
        lead="Real electric bills from our customers — before and after switching to solar."
      />

      <Section tone="white" container="narrow">
        {results.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No results yet"
            body="Customer bill comparisons will appear here. Check back soon."
            action={<Button href="/booking">Get a quote</Button>}
          />
        ) : (
          <div className="flex flex-col gap-16 sm:gap-24">
            {results.map((result, i) => (
              <ResultCard key={result.id} result={result} index={i} onOpen={openLightbox} />
            ))}
          </div>
        )}
      </Section>

      <CtaBand
        title="Want a bill like these?"
        body="Tell us your monthly consumption and we'll size a system for your home or business."
      />
    </Layout>
  );
}
