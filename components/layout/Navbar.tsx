'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, LayoutGrid, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { DbService } from '@/lib/firebase/types';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [services, setServices] = useState<DbService[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('display_order', 'asc'));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DbService[];
      setServices(data);
    });
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

  const isServicesActive = pathname.startsWith('/services') || pathname.startsWith('/products');
  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !scrolled;

  const linkClass = (active: boolean) =>
    `text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
      active
        ? 'text-solar-500 bg-solar-500/10'
        : isTransparent
          ? 'text-white/90 hover:text-white hover:bg-white/10'
          : 'text-navy-900 hover:text-solar-600 hover:bg-navy-50'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparent
          ? 'bg-transparent py-5'
          : 'bg-white/80 backdrop-blur-xl shadow-[0_1px_20px_rgba(15,31,64,0.08)] py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/Logos/JMC SOLAR.png" alt="JMC Solar Logo" />
          </div>
          <div className="leading-tight">
            <span className="font-montserrat text-base tracking-tight flex gap-1">
              <span className={`font-black text-2xl transition-colors duration-300 ${isTransparent ? 'text-white' : 'text-navy-900'}`}>JMC</span>
              <span className={`text-2xl font-medium transition-colors duration-300 ${isTransparent ? 'text-white/70' : 'text-navy-500'}`}>SOLAR</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          <Link href="/" className={linkClass(pathname === '/')}>
            Home
          </Link>

          {/* Services Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`${linkClass(isServicesActive)} inline-flex items-center gap-1.5 cursor-pointer`}
            >
              Services
              <motion.span
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated border border-slate-100/80 overflow-hidden z-50"
                >
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Overview
                    </p>
                    <Link
                      href="/services"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-solar-500/8 hover:text-solar-600 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-solar-500/10 rounded-lg flex items-center justify-center">
                        <LayoutGrid size={15} className="text-solar-500" />
                      </div>
                      All Services
                    </Link>
                  </div>

                  <div className="h-px bg-slate-100 mx-4" />

                  <div className="px-4 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Service Types
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {services.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/services/${service.slug}`}
                          className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                            pathname === `/services/${service.slug}`
                              ? 'text-solar-600 bg-solar-500/8 font-medium'
                              : 'text-slate-600 hover:text-solar-600 hover:bg-solar-500/5'
                          }`}
                        >
                          {service.title}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 mx-4" />

                  <div className="px-4 py-3">
                    <Link
                      href="/products"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-solar-500/8 hover:text-solar-600 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-navy-900/8 rounded-lg flex items-center justify-center">
                        <Package size={15} className="text-navy-700" />
                      </div>
                      Products
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/projects" className={linkClass(pathname === '/projects')}>
            Projects
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/#contact"
            className={`font-bold text-sm px-6 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md ${
              isTransparent
                ? 'bg-white text-navy-900 hover:bg-white/90'
                : 'bg-navy-900 text-white hover:bg-navy-800'
            }`}
          >
            Get a Quote
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`lg:hidden p-2.5 rounded-xl transition-colors ${
            isTransparent
              ? 'text-white hover:bg-white/10'
              : 'text-navy-900 hover:bg-navy-50'
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                <Menu size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden overflow-hidden bg-navy-950/98 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-4 py-5 flex flex-col gap-1">
              <Link
                href="/"
                className={`text-base font-medium px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/' ? 'text-solar-400 bg-white/5' : 'text-white/80 hover:text-solar-400 hover:bg-white/5'
                }`}
              >
                Home
              </Link>

              {/* Services accordion */}
              <div>
                <button
                  onClick={() => setMobileServicesOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between text-base font-medium px-4 py-3.5 rounded-xl transition-colors ${
                    isServicesActive ? 'text-solar-400 bg-white/5' : 'text-white/80 hover:text-solar-400 hover:bg-white/5'
                  }`}
                >
                  Services
                  <motion.span
                    animate={{ rotate: mobileServicesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 pb-3 flex flex-col gap-0.5 mt-1">
                        <Link
                          href="/services"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-solar-400 hover:bg-white/5 transition-colors"
                        >
                          <LayoutGrid size={14} />
                          All Services
                        </Link>

                        <div className="h-px bg-white/10 my-1.5 mx-3" />

                        {services.map((s) => (
                          <Link
                            key={s.slug}
                            href={`/services/${s.slug}`}
                            className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                              pathname === `/services/${s.slug}`
                                ? 'text-solar-400 bg-white/5'
                                : 'text-white/70 hover:text-solar-400 hover:bg-white/5'
                            }`}
                          >
                            {s.title}
                          </Link>
                        ))}

                        <div className="h-px bg-white/10 my-1.5 mx-3" />

                        <Link
                          href="/products"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-solar-400 hover:bg-white/5 transition-colors"
                        >
                          <Package size={14} />
                          Products
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/projects"
                className={`text-base font-medium px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === '/projects' ? 'text-solar-400 bg-white/5' : 'text-white/80 hover:text-solar-400 hover:bg-white/5'
                }`}
              >
                Projects
              </Link>

              <a
                href="/#contact"
                className="mt-3 w-full block bg-solar-500 hover:bg-solar-400 text-navy-900 font-bold text-base px-5 py-3.5 rounded-xl transition-all duration-200 text-center"
              >
                Get a Free Quote
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
