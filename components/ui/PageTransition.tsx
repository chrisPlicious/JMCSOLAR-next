'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';

interface Props {
  children: ReactNode;
}

import { FrozenRouter } from './FrozenRouter';

export default function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

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

    lenisRef.current = lenis;

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
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  // On route change: scroll to hash if present, otherwise scroll to top
  useEffect(() => {
    if (!lenisRef.current) return;
    const hash = window.location.hash;
    if (hash) {
      // AnimatePresence mode="wait" holds the new page unmounted for ~400ms
      // while the old page exits. Wait 500ms so the new page is in the DOM,
      // then snap instantly (page is still near opacity:0 so user never sees hero).
      const t = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el && lenisRef.current) {
          lenisRef.current.scrollTo(el as HTMLElement, {
            immediate: true,
            offset: -80, // clear the fixed navbar
          });
        }
      }, 500);
      return () => clearTimeout(t);
    } else {
      lenisRef.current.scrollTo(0, { duration: 1.5 });
    }
  }, [pathname]);

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

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
