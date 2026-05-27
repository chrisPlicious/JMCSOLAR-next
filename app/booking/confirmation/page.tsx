import Link from 'next/link';
import { Check, Calendar, Phone, ArrowRight, Home } from 'lucide-react';

export const metadata = {
  title: 'Booking Confirmed — JMC Solar PH',
};

const NEXT_STEPS = [
  {
    icon: Phone,
    title: 'We\'ll call you',
    desc: 'Our team will contact you within 24 hours to confirm your schedule.',
  },
  {
    icon: Calendar,
    title: 'Site visit',
    desc: 'A licensed electrical engineer will visit your property at the agreed time.',
  },
  {
    icon: Check,
    title: 'Free quote',
    desc: 'You\'ll receive a detailed proposal and system recommendation — at no cost.',
  },
];

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; name?: string }>;
}) {
  const { id, name } = await searchParams;
  const displayName = name ? decodeURIComponent(name) : 'there';
  const refNumber = id ? id.slice(0, 8).toUpperCase() : '—';

  return (
    <main className="min-h-screen bg-slate-50 flex items-center">
      <div className="w-full max-w-lg mx-auto px-4 py-24">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">

          {/* Success header */}
          <div className="bg-navy-950 px-8 pt-12 pb-10 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(245,158,11,0.3) 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              {/* Animated check */}
              <div className="w-20 h-20 bg-solar-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_0_8px_rgba(251,191,36,0.15)]">
                <Check size={36} strokeWidth={3} className="text-navy-950" />
              </div>
              <h1
                className="text-white font-black text-3xl mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Booking Received!
              </h1>
              <p className="text-white/60 text-sm">
                Thanks {displayName}, we&apos;ll be in touch soon.
              </p>
            </div>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Reference */}
            <div className="bg-solar-400/8 border border-solar-400/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Reference Number
                </p>
                <p className="text-navy-900 font-black text-lg tracking-widest font-mono">
                  JMC-{refNumber}
                </p>
              </div>
              <div className="w-10 h-10 bg-solar-400/15 rounded-xl flex items-center justify-center">
                <span className="text-solar-600 text-lg">☀</span>
              </div>
            </div>

            {/* What happens next */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                What Happens Next
              </p>
              <div className="space-y-4">
                {NEXT_STEPS.map(({ icon: Icon, title, desc }, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-navy-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-colors min-h-[44px] flex-1"
              >
                <Home size={15} />
                Back to Home
              </Link>
              <Link
                href="/services"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-navy-700 font-semibold text-sm hover:bg-slate-50 transition-colors min-h-[44px] flex-1"
              >
                Our Services
                <ArrowRight size={15} />
              </Link>
            </div>

            <p className="text-center text-slate-400 text-xs">
              Questions? Call us at{' '}
              <a href="tel:+639175088220" className="text-navy-700 font-semibold hover:text-solar-600 transition-colors">
                0917 508 8220
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
