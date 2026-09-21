'use client';

import { type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { baseTransition } from '@/lib/motion';

/**
 * Honours the OS "reduce motion" setting for every framer-motion element
 * (transforms are dropped, opacity still fades) and gives un-configured
 * animations the house ease instead of framer's default spring.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={baseTransition}>
      {children}
    </MotionConfig>
  );
}
