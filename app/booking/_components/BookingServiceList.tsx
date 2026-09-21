'use client';

import Link from 'next/link';
import { Lightbulb, Wrench, MapPinned, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { fadeUp, stagger } from '@/lib/motion';

const BOOKING_TYPES = [
  {
    href: '/booking/consultation',
    Icon: Lightbulb,
    title: 'Consultation',
    tag: '₱500/hr',
    tone: 'solar',
    description:
      'Sit down with our licensed engineers. We assess your property and recommend the right solar system for your needs.',
  },
  {
    href: '/booking/maintenance',
    Icon: Wrench,
    title: 'Maintenance',
    tag: '₱1 per Watt',
    tone: 'info',
    description:
      'Panel cleaning, inverter diagnostics, performance audits, and troubleshooting for your installed solar system.',
  },
  {
    href: '/booking/site-assessment',
    Icon: MapPinned,
    title: 'Site Assessment',
    tag: 'From ₱500',
    tone: 'success',
    description:
      'On-site property evaluation to determine solar potential, roof suitability, and system sizing before installation. Rates: ₱500 (Ormoc City), ₱1,000 (Ormoc far barangay), ₱2,000 (other areas). REFUNDABLE if project is confirmed.',
  },
] as const;

const TRUST_SIGNALS = ['Transparent pricing', 'Licensed EE engineers', '24-hour response'];

export default function BookingServiceList() {
  return (
    <>
      <motion.ul className="mb-auto space-y-4" variants={stagger(0.08, 0.2)} initial="hidden" animate="visible">
        {BOOKING_TYPES.map(({ href, Icon, title, tag, tone, description }) => (
          <motion.li key={href} variants={fadeUp}>
            <Link
              href={href}
              className="group flex flex-col gap-5 rounded-card border border-line bg-white p-6 transition-[border-color,box-shadow,transform] duration-300 ease-out-quart hover:-translate-y-1 hover:border-solar-300 hover:shadow-card-hover sm:flex-row sm:items-center sm:gap-6 sm:p-8"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-control bg-navy-50 text-navy-950">
                <Icon className="size-7" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-h3 text-fg">{title}</h2>
                  <Badge tone={tone}>{tag}</Badge>
                </div>
                <p className="text-base leading-relaxed text-fg-muted">{description}</p>
              </div>
              <ArrowRight
                className="hidden size-6 shrink-0 text-fg-subtle transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-fg sm:block"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
          </motion.li>
        ))}
      </motion.ul>

      {/* Trust signals */}
      <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-line pt-8 sm:mt-16">
        {TRUST_SIGNALS.map((t) => (
          <li key={t} className="flex items-center gap-2 text-sm text-fg-muted">
            <Check className="size-4 text-navy-950" strokeWidth={2} aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </>
  );
}
