'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '@/lib/motion';
import MobileMenu from './MobileMenu';
import ServicesMenu from './ServicesMenu';
import { Wordmark } from './Wordmark';
import { SERVICES_ROUTES, TOP_LINKS, isUnder } from './nav-data';

const SOLID_AFTER    = 80;  // px scrolled before the bar turns solid and narrows
const HIDE_AFTER     = 240; // px scrolled before scrolling down tucks the bar away
const SCROLL_SLOP    = 8;   // ignore direction changes smaller than this
const HOVER_OPEN_MS  = 80;  // hover intent before the Services menu opens
const HOVER_CLOSE_MS = 160; // grace period to cross from the trigger into the menu

const SERVICES_MENU_ID = 'services-menu';

/**
 * Floating pill navbar. Transparent glass over the home hero, solid white
 * everywhere else; narrows once scrolled, hides on scroll down and returns on
 * scroll up. Service links here are client-only — Footer, ServiceIndex and
 * ServiceHighlights server-render them for crawlers.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const openedByHover = useRef(false);
  const servicesOpenRef = useRef(false);

  useEffect(() => {
    servicesOpenRef.current = servicesOpen;
  }, [servicesOpen]);

  // ── Scroll: solid/narrow past the hero top, hide on the way down ─────────
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SOLID_AFTER);
      if (y < HIDE_AFTER) {
        setHidden(false);
        lastY = y;
      } else if (y > lastY + SCROLL_SLOP) {
        // Keep the bar while a keyboard user is working inside it.
        if (!navRef.current?.querySelector(':focus-visible')) setHidden(true);
        lastY = y;
      } else if (y < lastY - SCROLL_SLOP) {
        setHidden(false);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Services menu: hover intent, click, Escape, click/focus outside ──────
  const closeServices = useCallback(() => {
    window.clearTimeout(hoverTimer.current);
    openedByHover.current = false;
    setServicesOpen(false);
  }, []);

  const hoverOpen = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      if (servicesOpenRef.current) return;
      openedByHover.current = true;
      setServicesOpen(true);
    }, HOVER_OPEN_MS);
  };

  const hoverClose = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverTimer.current);
    // A menu opened by click stays open until click outside, Escape or a link.
    if (servicesOpenRef.current && !openedByHover.current) return;
    hoverTimer.current = window.setTimeout(closeServices, HOVER_CLOSE_MS);
  };

  const toggleServices = () => {
    window.clearTimeout(hoverTimer.current);
    // A click just after hover opened the menu pins it rather than closing it.
    if (servicesOpen && openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setServicesOpen((open) => !open);
  };

  useEffect(() => {
    if (!servicesOpen) return;
    const outside = (t: EventTarget | null) =>
      !panelRef.current?.contains(t as Node) && !triggerRef.current?.contains(t as Node);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      closeServices();
      triggerRef.current?.focus();
    };
    const onPointer = (e: MouseEvent) => outside(e.target) && closeServices();
    const onFocus = (e: FocusEvent) => outside(e.target) && closeServices();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('focusin', onFocus);
    };
  }, [servicesOpen, closeServices]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Close everything on navigation.
  useEffect(() => {
    setMenuOpen(false);
    closeServices();
  }, [pathname, closeServices]);

  const closeMobile = useCallback(() => setMenuOpen(false), []);

  const isHomePage = pathname === '/';
  const isServicesActive = SERVICES_ROUTES.some((base) => isUnder(pathname, base));
  // Glass over the home hero; solid once scrolled, on every other page, and
  // while the Services menu is open so bar and menu read as one surface.
  const solid = !isHomePage || scrolled || servicesOpen;
  const tucked = hidden && !menuOpen && !servicesOpen;

  const linkClass = (active: boolean) =>
    cn(
      'relative isolate inline-flex h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors duration-150',
      active ? 'text-fg' : 'text-fg-muted hover:text-fg',
    );

  // Hover highlight that slides between links; the active page keeps its solar bar.
  const decorations = (key: string, active: boolean) => (
    <>
      <AnimatePresence>
        {hovered === key && (
          <motion.span
            layoutId="nav-hover"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="absolute inset-0 -z-10 rounded-full bg-fg/8"
          />
        )}
      </AnimatePresence>
      {active && <span aria-hidden className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-solar-500" />}
    </>
  );

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main"
        onFocusCapture={() => setHidden(false)}
        className={cn(
          'fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-300 ease-out-quart sm:px-4 sm:pt-4',
          tucked && '-translate-y-[calc(100%+4rem)]',
        )}
      >
        <div
          className={cn(
            'relative mx-auto flex h-14 items-center justify-between rounded-full pr-2 pl-4 ring-1 transition-[max-width,background-color,box-shadow] duration-300 ease-out-quart lg:grid lg:grid-cols-[1fr_auto_1fr]',
            scrolled ? 'max-w-5xl' : 'max-w-7xl',
            solid
              ? 'bg-white shadow-elevated ring-line'
              : 'surface-dark bg-navy-950/30 ring-white/15 backdrop-blur-md',
          )}
        >
          <Link href="/" aria-label="JMC Solar home" className="justify-self-start">
            <Wordmark tone={solid ? 'dark' : 'light'} />
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center lg:flex" onPointerLeave={() => setHovered(null)}>
            <li onPointerEnter={() => setHovered('/')}>
              <Link href="/" className={linkClass(isHomePage)} aria-current={isHomePage ? 'page' : undefined}>
                Home
                {decorations('/', isHomePage)}
              </Link>
            </li>

            <li
              onPointerEnter={(e) => {
                setHovered('services');
                hoverOpen(e);
              }}
              onPointerLeave={hoverClose}
            >
              <button
                ref={triggerRef}
                type="button"
                onClick={toggleServices}
                aria-expanded={servicesOpen}
                aria-controls={SERVICES_MENU_ID}
                className={cn(linkClass(isServicesActive), 'cursor-pointer')}
              >
                Services
                <motion.span
                  animate={{ rotate: servicesOpen ? 180 : 0 }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  className="inline-flex"
                >
                  <ChevronDown size={14} aria-hidden />
                </motion.span>
                {decorations('services', isServicesActive)}
              </button>

              {/* Right after the trigger so Tab moves into it, and inside this
                  <li> so pointerleave treats trigger + menu as one target. */}
              <AnimatePresence>
                {servicesOpen && (
                  <ServicesMenu ref={panelRef} id={SERVICES_MENU_ID} pathname={pathname} onNavigate={closeServices} />
                )}
              </AnimatePresence>
            </li>

            {TOP_LINKS.filter((l) => l.href !== '/').map(({ href, label }) => {
              const active = isUnder(pathname, href);
              return (
                <li key={href} onPointerEnter={() => setHovered(href)}>
                  <Link href={href} className={linkClass(active)} aria-current={active ? 'page' : undefined}>
                    {label}
                    {decorations(href, active)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-self-end gap-2">
            <Button href="/booking" size="sm" className="hidden lg:inline-flex">
              Get a quote
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-fg hover:bg-fg/10 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={22} aria-hidden />
            </Button>
          </div>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={closeMobile} pathname={pathname} />
    </>
  );
}
