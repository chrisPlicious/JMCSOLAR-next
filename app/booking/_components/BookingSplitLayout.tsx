'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { DURATION, EASE_OUT } from '@/lib/motion';

interface Props {
  leftTitle: ReactNode;
  leftDescription?: string;
  children: ReactNode;
}

/**
 * The booking funnel's signature split: a sticky navy panel (title) beside a
 * white work area. The panel widens at `lg` so the longest single-word titles
 * ("Consultation.") fit at text-h2 without clipping; below `lg` it stacks on
 * top at text-h1.
 */
export default function BookingSplitLayout({ leftTitle, leftDescription, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Left panel */}
      <div className="surface-dark texture-module relative flex w-full shrink-0 flex-col justify-center overflow-hidden bg-navy-950 px-6 pt-28 pb-12 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:w-[34%] lg:self-start lg:px-10 lg:pt-24 lg:pb-16 xl:w-[30%] xl:px-12">
        <div className="relative min-w-0">
          <motion.h1
            className="mb-5 text-h1 break-words text-fg lg:text-h2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }}
          >
            {leftTitle}
          </motion.h1>
          {leftDescription && (
            <motion.p
              className="max-w-sm text-base leading-relaxed text-fg-muted"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.2 }}
            >
              {leftDescription}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right column — clears the fixed navbar on desktop (the panel stacks
          above it on mobile and already carries the clearance). */}
      <div className="flex w-full min-w-0 flex-1 flex-col lg:min-h-screen lg:pt-20">{children}</div>
    </div>
  );
}
