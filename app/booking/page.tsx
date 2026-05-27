import Link from 'next/link';
import { Lightbulb, Wrench, MapPinned, ArrowRight, Check } from 'lucide-react';
import type { Metadata } from 'next';
import BookingSplitLayout from './_components/BookingSplitLayout';

export const metadata: Metadata = {
  title: 'Book a Service — JMC Solar',
  description: 'Book a solar consultation, maintenance service, or site assessment with JMC Solar.',
};

const BOOKING_TYPES = [
  {
    href: '/booking/consultation',
    Icon: Lightbulb,
    title: 'Consultation',
    tag: 'FREE · 60 MIN',
    tagStyle: 'text-solar-600 bg-solar-50 border border-solar-100',
    description:
      'Sit down with our licensed engineers. We assess your property and recommend the right solar system for your needs.',
  },
  {
    href: '/booking/maintenance',
    Icon: Wrench,
    title: 'Maintenance',
    tag: 'O&M SERVICE',
    tagStyle: 'text-blue-600 bg-blue-50 border border-blue-100',
    description:
      'Panel cleaning, inverter diagnostics, performance audits, and troubleshooting for your installed solar system.',
  },
  {
    href: '/booking/site-assessment',
    Icon: MapPinned,
    title: 'Site Assessment',
    tag: 'ON-SITE SURVEY',
    tagStyle: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    description:
      'On-site property evaluation to determine solar potential, roof suitability, and system sizing before installation.',
  },
];

export default function BookingSelectionPage() {
  return (
    <BookingSplitLayout
      leftTag={`BOOKING · ${new Date().getFullYear()}`}
      leftTitle={
        <>
          Sunlight,
          <br />
          engineered.
        </>
      }
      leftDescription="A licensed engineering team that designs solar systems specifically for your roof, your bill, and your future."
    >
      <div className="p-8 lg:p-16 max-w-7xl xl:ml-12 lg:min-h-screen flex flex-col">
        <div className="mb-12 pt-8 lg:pt-16">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Index</p>
          <h2 className="text-4xl sm:text-7xl font-light text-navy-950 mb-4 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Three ways to begin.
          </h2>
          <p className="text-slate-500 text-sm sm:text-xl leading-relaxed max-w-lg">
            Each is staffed by the same licensed engineering team. Pick whichever matches where you are in your solar journey.
          </p>
        </div>

        <div className="space-y-5 mb-auto">
          {BOOKING_TYPES.map(({ href, Icon, title, tag, tagStyle, description }, idx) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col sm:flex-row sm:items-center gap-8 bg-white p-8 sm:p-10 border border-slate-200 transition-all duration-300 hover:border-solar-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="text-slate-300 font-serif text-5xl font-light shrink-0 w-10 sm:w-14 text-left sm:text-center transition-colors group-hover:text-solar-300">
                0{idx + 1}
              </div>
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <Icon size={38} strokeWidth={1.5} className="text-navy-950 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-2xl sm:text-5xl text-navy-950 font-bold tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm ${tagStyle}`}>
                    {tag}
                  </span>
                </div>
                <p className="text-base sm:text-lg text-slate-500 leading-relaxed pr-4">
                  {description}
                </p>
              </div>
              <ArrowRight className="hidden sm:block text-slate-300 group-hover:text-navy-950 transition-colors shrink-0" size={26} strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="pt-12 sm:pt-16 mt-16 border-t border-slate-200 flex flex-wrap gap-x-12 gap-y-4">
          {['No upfront cost', 'Licensed EE engineers', '24-hour response'].map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-slate-500 text-xs tracking-wide">
              <Check size={14} className="text-navy-950" strokeWidth={2} />
              {t}
            </div>
          ))}
        </div>
      </div>
    </BookingSplitLayout>
  );
}