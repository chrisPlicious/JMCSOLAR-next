"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface TestimonialsColumnProps {
  /** The cards. Rendered twice so the -50% scroll loops without a seam. */
  children: ReactNode;
  className?: string;
  /** Seconds for one full pass of the list. */
  duration?: number;
}

/**
 * Vertical, endlessly scrolling column of cards (21st.dev "testimonials-columns-1").
 * Cards come in as children so they can stay server-rendered. Reduced motion is
 * handled by MotionConfig in MotionProvider: the column simply stands still.
 */
export function TestimonialsColumn({ children, className, duration = 10 }: TestimonialsColumnProps) {
  return (
    <div className={className}>
      <motion.div
        animate={{ y: "-50%" }}
        transition={{ duration, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        className="flex flex-col gap-6 pb-6"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-6" aria-hidden={copy === 1 || undefined}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default TestimonialsColumn;
