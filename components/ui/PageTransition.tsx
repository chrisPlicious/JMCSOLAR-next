'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Fades in each page on navigation.
 *
 * key={pathname} makes React unmount the old page div and mount a fresh one
 * on every route change. Framer Motion animates the new div opacity 0 → 1.
 * No event interception needed — works with Next.js's default navigation.
 * ScrollToTop (in layout) handles resetting scroll position.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Skip animation in the admin panel
  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
