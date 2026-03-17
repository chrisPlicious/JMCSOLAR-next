'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

interface Props {
  children: ReactNode;
}

import { FrozenRouter } from './FrozenRouter';

export default function PageTransition({ children }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      
      if (href?.startsWith('#')) {
        e.preventDefault();
        lenis.scrollTo(href);
      } else if (href?.includes('/#')) {
        // If navigating to a different page hash, we let Next.js handle the route change,
        // but maybe the user is already on the page?
        const currentPath = window.location.pathname;
        const [path, hash] = href.split('#');
        
        if (path === currentPath || (path === '' && hash)) {
          e.preventDefault();
          lenis.scrollTo(`#${hash}`);
        }
      }
    };

    document.documentElement.addEventListener('click', handleAnchorClick);

    return () => {
      document.documentElement.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
