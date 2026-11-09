'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BUSINESS } from '@/lib/seo/business';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT, fadeUp, stagger } from '@/lib/motion';
import { BOOKING_LINK, NAV_SERVICE_ITEMS, PLAN_LINKS, SERVICES_ROUTES, TOP_LINKS, isUnder } from './nav-data';
import { Wordmark } from './Wordmark';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
}

/**
 * Full-screen navy sheet for phones and tablets: big links, service chips
 * instead of a nested accordion, and call / message / quote in the thumb zone.
 * Traps focus, closes on Escape, and locks page scroll while open.
 */
export default function MobileMenu({ open, onClose, pathname }: MobileMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    // The sheet is phone/tablet only; growing past lg hands back to the desktop bar.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onDesktop = (e: MediaQueryListEvent) => e.matches && onClose();
    desktop.addEventListener('change', onDesktop);

    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open, onClose]);

  const servicesActive = SERVICES_ROUTES.some((base) => isUnder(pathname, base));

  const bigLink = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 py-1.5 font-display text-h2 transition-colors duration-150',
        active ? 'text-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {label}
      {active && <span aria-hidden className="size-2 rounded-full bg-solar-500" />}
    </Link>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={sheetRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
          onClick={(e) => {
            // Same-page links (e.g. /#contact on the homepage) don't change the
            // pathname, so close on any link tap rather than on navigation.
            if ((e.target as HTMLElement).closest('a')) onClose();
          }}
          className="surface-dark fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-navy-950 lg:hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5">
            <Link href="/" aria-label="JMC Solar home">
              <Wordmark tone="light" />
            </Link>
            <Button
              ref={closeRef}
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close menu"
              className="text-fg hover:bg-white/10"
            >
              <X size={22} aria-hidden />
            </Button>
          </div>

          <motion.nav
            aria-label="Mobile"
            variants={stagger(0.05, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex-1 px-6 pt-10 pb-8"
          >
            <ul className="flex flex-col gap-1">
              <motion.li variants={fadeUp}>{bigLink('/', 'Home', pathname === '/')}</motion.li>
              <motion.li variants={fadeUp}>
                {bigLink('/services', 'Services', servicesActive)}
                <ul className="mt-2 mb-3 flex flex-wrap gap-2">
                  {NAV_SERVICE_ITEMS.map(({ href, short }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={pathname === href ? 'page' : undefined}
                        className={cn(
                          'inline-flex rounded-control px-3 py-2 text-sm font-semibold transition-colors duration-150',
                          pathname === href ? 'bg-solar-500 text-navy-950' : 'bg-white/10 text-fg hover:bg-white/20',
                        )}
                      >
                        {short}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.li>
              {TOP_LINKS.filter((l) => l.href !== '/').map(({ href, label }) => (
                <motion.li key={href} variants={fadeUp}>
                  {bigLink(href, label, isUnder(pathname, href))}
                </motion.li>
              ))}
            </ul>

            <motion.ul variants={fadeUp} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-6">
              {[BOOKING_LINK, ...PLAN_LINKS].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isUnder(pathname, href) ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 py-2.5 text-sm font-semibold transition-colors duration-150',
                      isUnder(pathname, href) ? 'text-fg' : 'text-fg-muted hover:text-fg',
                    )}
                  >
                    <Icon size={16} aria-hidden className="text-solar-ink" />
                    {label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          </motion.nav>

          {/* Thumb zone */}
          <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-navy-950 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Button href="/booking" fullWidth>
              Get a quote
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button href={`tel:${BUSINESS.phone.e164}`} variant="outline-dark" size="sm">
                <Phone size={16} aria-hidden />
                Call us
              </Button>
              <Button href="/#contact" variant="outline-dark" size="sm">
                <MessageCircle size={16} aria-hidden />
                Message us
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
