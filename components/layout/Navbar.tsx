'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, LayoutGrid, Package, Calculator, MapPin, CalendarCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_SERVICES } from '@/data/services';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT } from '@/lib/motion';

// Every route reachable from the Services dropdown marks "Services" active.
const SERVICES_ROUTES = ['/services', '/products', '/calculator', '/locations', '/booking'];

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  // Services are defined in code, so the dropdown renders straight from NAV_SERVICES —
  // no state, no post-hydration refetch. (These menus are conditionally mounted, so they
  // are NOT an SSR crawl surface — Footer/ServiceIndex/HomeExplore server-render the
  // service links for crawlers.)
  const services = NAV_SERVICES;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close everything on navigation
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isServicesActive = SERVICES_ROUTES.some((base) => isUnder(pathname, base));
  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !scrolled;

  // Desktop top-level link: navy (or white over the hero) text; active state is
  // a small solar bar underneath, never amber text.
  const linkClass = (active: boolean) =>
    cn(
      'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
      isTransparent
        ? active
          ? 'text-white'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
        : active
          ? 'text-navy-950'
          : 'text-slate-600 hover:bg-navy-50 hover:text-navy-950',
    );

  const activeBar = (active: boolean) =>
    active ? (
      <span aria-hidden className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-solar-500" />
    ) : null;

  // Dropdown rows (light panel).
  const menuRowClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors duration-200',
      active ? 'bg-navy-50 text-navy-950' : 'text-navy-950 hover:bg-navy-50',
    );
  const iconTile = 'flex size-8 items-center justify-center rounded-control bg-navy-50 text-navy-700';

  // Mobile rows (dark panel, inside surface-dark).
  const mobileRowClass = (active: boolean, size: 'lg' | 'sm' = 'lg') =>
    cn(
      'flex items-center gap-2 rounded-control transition-colors',
      size === 'lg' ? 'px-4 py-3.5 text-base font-medium' : 'px-4 py-2.5 text-sm font-semibold',
      active ? 'bg-white/10 text-fg' : 'text-fg-muted hover:bg-white/10 hover:text-fg',
    );

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-500',
        // Solid white: translucent white turns grey over the navy page heroes.
        isTransparent ? 'bg-transparent py-5' : 'bg-white py-3 shadow-soft',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center">
            <img src="/Logos/JMC SOLAR.png" alt="JMC Solar Logo" />
          </div>
          <span className="flex gap-1 font-wordmark text-2xl leading-tight">
            <span
              className={cn(
                'font-extrabold transition-colors duration-300',
                isTransparent ? 'text-white' : 'text-navy-950',
              )}
            >
              JMC
            </span>
            <span
              className={cn(
                'font-medium transition-colors duration-300',
                isTransparent ? 'text-white/80' : 'text-navy-500',
              )}
            >
              SOLAR
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          <Link href="/" className={linkClass(isHomePage)} aria-current={isHomePage ? 'page' : undefined}>
            Home
            {activeBar(isHomePage)}
          </Link>

          {/* Services Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className={cn(linkClass(isServicesActive), 'cursor-pointer')}
            >
              Services
              <motion.span
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                className="inline-flex"
              >
                <ChevronDown size={14} aria-hidden />
              </motion.span>
              {activeBar(isServicesActive)}
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: DURATION.fast, ease: EASE_OUT }}
                  className="absolute top-full left-1/2 z-50 mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-card border border-line bg-white shadow-elevated"
                >
                  <div className="px-4 pt-4 pb-2">
                    <p className="caps mb-2">Overview</p>
                    <Link href="/booking" className={menuRowClass(isUnder(pathname, '/booking'))}>
                      <span className="flex size-8 items-center justify-center rounded-control bg-solar-500 text-navy-950">
                        <CalendarCheck size={15} aria-hidden />
                      </span>
                      Book a Service
                    </Link>

                    <div className="mx-1 my-2 h-px bg-line" />

                    <Link href="/services" className={menuRowClass(pathname === '/services')}>
                      <span className={iconTile}>
                        <LayoutGrid size={15} aria-hidden />
                      </span>
                      All Services
                    </Link>
                    <Link href="/locations" className={menuRowClass(isUnder(pathname, '/locations'))}>
                      <span className={iconTile}>
                        <MapPin size={15} aria-hidden />
                      </span>
                      Locations
                    </Link>
                  </div>

                  <div className="mx-4 h-px bg-line" />

                  <div className="px-4 py-2">
                    <p className="caps mb-2">Service Types</p>
                    <div className="flex flex-col gap-0.5">
                      {services.map((service) => {
                        const active = pathname === `/services/${service.slug}`;
                        return (
                          <Link
                            key={service.slug}
                            href={`/services/${service.slug}`}
                            className={cn(
                              'rounded-control px-3 py-2 text-sm transition-colors duration-200',
                              active
                                ? 'bg-navy-50 font-semibold text-navy-950'
                                : 'text-fg-muted hover:bg-navy-50 hover:text-navy-950',
                            )}
                          >
                            {service.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mx-4 h-px bg-line" />

                  <div className="flex flex-col gap-1 px-4 py-3">
                    <Link href="/products" className={menuRowClass(isUnder(pathname, '/products'))}>
                      <span className={iconTile}>
                        <Package size={15} aria-hidden />
                      </span>
                      Products
                    </Link>
                    <Link href="/calculator" className={menuRowClass(isUnder(pathname, '/calculator'))}>
                      <span className={iconTile}>
                        <Calculator size={15} aria-hidden />
                      </span>
                      Solar Calculator
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/projects" className={linkClass(isUnder(pathname, '/projects'))}>
            Projects
            {activeBar(isUnder(pathname, '/projects'))}
          </Link>

          <Link href="/results" className={linkClass(isUnder(pathname, '/results'))}>
            Results
            {activeBar(isUnder(pathname, '/results'))}
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/booking" size="sm">
            Get a quote
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('lg:hidden', isTransparent ? 'text-white hover:bg-white/10' : 'text-navy-950')}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? 'mobile-menu' : undefined}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast }}
                className="inline-flex"
              >
                <X size={22} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast }}
                className="inline-flex"
              >
                <Menu size={22} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="surface-dark overflow-hidden border-t border-line bg-navy-950 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-5">
              <Link href="/" className={mobileRowClass(isHomePage)}>
                Home
              </Link>

              {/* Services accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileServicesOpen((prev) => !prev)}
                  aria-expanded={mobileServicesOpen}
                  className={cn(mobileRowClass(isServicesActive), 'w-full cursor-pointer justify-between')}
                >
                  Services
                  <motion.span
                    animate={{ rotate: mobileServicesOpen ? 180 : 0 }}
                    transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    className="inline-flex"
                  >
                    <ChevronDown size={16} aria-hidden />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.base, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 flex flex-col gap-0.5 pb-3 pl-3">
                        <Link href="/booking" className={mobileRowClass(isUnder(pathname, '/booking'), 'sm')}>
                          <CalendarCheck size={14} aria-hidden />
                          Book a Service
                        </Link>

                        <div className="mx-3 my-1 h-px bg-line" />

                        <Link href="/services" className={mobileRowClass(pathname === '/services', 'sm')}>
                          <LayoutGrid size={14} aria-hidden />
                          All Services
                        </Link>

                        <Link href="/locations" className={mobileRowClass(isUnder(pathname, '/locations'), 'sm')}>
                          <MapPin size={14} aria-hidden />
                          Locations
                        </Link>

                        <div className="mx-3 my-1.5 h-px bg-line" />

                        {services.map((s) => (
                          <Link
                            key={s.slug}
                            href={`/services/${s.slug}`}
                            className={cn(
                              'rounded-control px-4 py-2.5 text-sm transition-colors',
                              pathname === `/services/${s.slug}`
                                ? 'bg-white/10 text-fg'
                                : 'text-fg-muted hover:bg-white/10 hover:text-fg',
                            )}
                          >
                            {s.title}
                          </Link>
                        ))}

                        <div className="mx-3 my-1.5 h-px bg-line" />

                        <Link href="/products" className={mobileRowClass(isUnder(pathname, '/products'), 'sm')}>
                          <Package size={14} aria-hidden />
                          Products
                        </Link>

                        <Link href="/calculator" className={mobileRowClass(isUnder(pathname, '/calculator'), 'sm')}>
                          <Calculator size={14} aria-hidden />
                          Solar Calculator
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/projects" className={mobileRowClass(isUnder(pathname, '/projects'))}>
                Projects
              </Link>

              <Link href="/results" className={mobileRowClass(isUnder(pathname, '/results'))}>
                Results
              </Link>

              <Button href="/booking" size="sm" fullWidth className="mt-3">
                Get a quote
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
