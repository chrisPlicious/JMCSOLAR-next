'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutGrid, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BUSINESS } from '@/lib/seo/business';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { NAV_SERVICE_ITEMS, PLAN_LINKS, isUnder } from './nav-data';

interface ServicesMenuProps {
  id: string;
  pathname: string;
  onNavigate: () => void;
}

const rowClass = (active: boolean) =>
  cn(
    'group flex items-start gap-3 rounded-control p-3 transition-colors duration-150',
    active ? 'bg-navy-50' : 'hover:bg-navy-50',
  );

const iconTile =
  'flex size-9 shrink-0 items-center justify-center rounded-control bg-navy-50 text-navy-700 transition-colors duration-150 group-hover:bg-white';

/**
 * Desktop Services mega menu: every system as a tile with a one-line benefit,
 * planning tools, and a booking side. Rendered under the floating bar; Navbar
 * owns open/close (hover intent, click, Escape, click or focus outside).
 * `surface-light` keeps it readable while the bar behind it is in its dark
 * glass state (the menu's exit fade over the home hero).
 */
const ServicesMenu = forwardRef<HTMLDivElement, ServicesMenuProps>(function ServicesMenu(
  { id, pathname, onNavigate },
  ref,
) {
  return (
    // pt-3 is a hover bridge: the pointer can cross the gap under the bar
    // without leaving the menu.
    <div
      ref={ref}
      id={id}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) onNavigate();
      }}
      className="surface-light absolute top-full left-1/2 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 pt-3"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: DURATION.fast, ease: EASE_OUT }}
        className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.9fr)] overflow-hidden rounded-card bg-white shadow-elevated ring-1 ring-line"
      >
        {/* Systems */}
        <div className="p-4 pr-2">
          <p className="caps px-3 pb-2">Solar systems</p>
          <ul className="grid grid-cols-2 gap-1">
            {NAV_SERVICE_ITEMS.map(({ href, title, blurb, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link href={href} className={rowClass(active)} aria-current={active ? 'page' : undefined}>
                    <span className={iconTile}>
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-fg">{title}</span>
                      <span className="block text-sm text-fg-muted">{blurb}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/services" className={rowClass(pathname === '/services')}>
                <span className={iconTile}>
                  <LayoutGrid size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-fg">
                    All services
                    <ArrowRight
                      size={14}
                      aria-hidden
                      className="transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="block text-sm text-fg-muted">Compare every system</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Planning tools */}
        <div className="my-4 border-l border-line px-2">
          <p className="caps px-3 pb-2">Plan your system</p>
          <ul className="flex flex-col gap-1">
            {PLAN_LINKS.map(({ href, label, blurb, icon: Icon }) => {
              const active = isUnder(pathname, href);
              return (
                <li key={href}>
                  <Link href={href} className={rowClass(active)} aria-current={active ? 'page' : undefined}>
                    <span className={iconTile}>
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-fg">{label}</span>
                      <span className="block text-sm text-fg-muted">{blurb}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Booking — the navy side of the panel, flush to its edges */}
        <div className="surface-dark flex flex-col justify-between gap-6 bg-navy-950 p-6">
          <div>
            <p className="font-display text-lg font-bold text-fg">Book a site visit</p>
            <p className="mt-1.5 text-sm text-fg-muted">
              A licensed electrical engineer visits your property. Your quote is free.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button href="/booking" size="sm" fullWidth>
              Book a visit
            </Button>
            <a
              href={`tel:${BUSINESS.phone.e164}`}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <Phone size={14} aria-hidden />
              {BUSINESS.phone.display}
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default ServicesMenu;
