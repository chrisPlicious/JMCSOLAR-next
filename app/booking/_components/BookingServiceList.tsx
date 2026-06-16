'use client';

import Link from 'next/link';
import { Lightbulb, Wrench, MapPinned, ArrowRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const BOOKING_TYPES = [
  {
    href: '/booking/consultation',
    Icon: Lightbulb,
    title: 'Consultation',
    tag: '₱500/HR',
    tagStyle: 'text-solar-600 bg-solar-50 border border-solar-100',
    description:
      'Sit down with our licensed engineers. We assess your property and recommend the right solar system for your needs.',
  },
  {
    href: '/booking/maintenance',
    Icon: Wrench,
    title: 'Maintenance',
    tag: '₱1 per Watt',
    tagStyle: 'text-blue-600 bg-blue-50 border border-blue-100',
    description:
      'Panel cleaning, inverter diagnostics, performance audits, and troubleshooting for your installed solar system.',
  },
  {
    href: '/booking/site-assessment',
    Icon: MapPinned,
    title: 'Site Assessment',
    tag: 'FROM ₱500',
    tagStyle: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    description:
      'On-site property evaluation to determine solar potential, roof suitability, and system sizing before installation. Rates: ₱500 (Ormoc City), ₱1,000 (Ormoc far barangay), ₱2,000 (other areas).',
  },
];

const TRUST_SIGNALS = ['Transparent pricing', 'Licensed EE engineers', '24-hour response'];

const easeExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOut: [number, number, number, number] = [0.25, 1, 0.5, 1];

export default function BookingServiceList() {
  const reduce = useReducedMotion();

  return (
    <>
      <div className="space-y-5 mb-auto">
        {BOOKING_TYPES.map(({ href, Icon, title, tag, tagStyle, description }, idx) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, x: reduce ? 0 : 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: easeExpo, delay: reduce ? 0 : 0.45 + idx * 0.12 }}
          >
            <Link
              href={href}
              className="group flex flex-col sm:flex-row sm:items-center gap-8 bg-white p-6 sm:p-8 border border-slate-200 transition-all duration-300 hover:border-solar-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="text-slate-300 font-serif text-3xl font-light shrink-0 w-10 sm:w-14 text-left sm:text-center transition-colors duration-300 group-hover:text-solar-300">
                0{idx + 1}
              </div>
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <Icon
                  size={38}
                  strokeWidth={1.5}
                  className="text-navy-950 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3
                    className="text-2xl sm:text-6xl text-navy-950 font-bold tracking-tight"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {title}
                  </h3>
                  <span className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-sm ${tagStyle}`}>
                    {tag}
                  </span>
                </div>
                <p className="text-base sm:text-lg text-slate-500 leading-relaxed pr-4">
                  {description}
                </p>
              </div>
              <ArrowRight
                className="hidden sm:block text-slate-300 group-hover:text-navy-950 group-hover:translate-x-2 transition-all duration-300 shrink-0"
                size={26}
                strokeWidth={1.5}
              />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="pt-12 sm:pt-16 mt-16 border-t border-slate-200 flex flex-wrap gap-x-12 gap-y-4">
        {TRUST_SIGNALS.map((t, idx) => (
          <motion.div
            key={t}
            className="flex items-center gap-2.5 text-slate-500 text-xs tracking-wide"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: reduce ? 0 : 0.85 + idx * 0.08 }}
          >
            <Check size={14} className="text-navy-950" strokeWidth={2} />
            {t}
          </motion.div>
        ))}
      </div>
    </>
  );
}
