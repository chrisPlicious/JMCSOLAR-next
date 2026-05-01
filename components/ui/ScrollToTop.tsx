'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip if navigating to a hash — let the browser scroll to the element
    if (window.location.hash) return;
    // 'instant' overrides scroll-behavior: smooth so there's no visible scroll animation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
