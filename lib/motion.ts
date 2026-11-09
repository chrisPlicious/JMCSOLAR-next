import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion vocabulary. Ease-out only (DESIGN.md bans bounce/elastic);
 * reduced motion is handled globally by <MotionProvider>.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.3,
  slow: 0.45,
} as const;

export const baseTransition: Transition = { duration: DURATION.slow, ease: EASE_OUT };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: baseTransition },
};

export function stagger(step = 0.07, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren } },
  };
}

/** Spread onto a motion element to reveal it once when it scrolls into view. */
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-60px' },
} as const;
