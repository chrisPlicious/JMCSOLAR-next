import Link from 'next/link';
import { Check, Calendar, Phone, ArrowRight, Home, Video, Clock3, CreditCard } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import type { DbBooking } from '@/lib/firebase/types';
import { formatCentavos } from '@/lib/bookings/pricing';

export const metadata = {
  title: 'Booking Confirmed — JMC Solar PH',
};

const FREE_NEXT_STEPS = [
  { icon: Phone, title: "We'll call you", desc: 'Our team will contact you within 24 hours to confirm your schedule.' },
  { icon: Calendar, title: 'Site visit', desc: 'A licensed electrical engineer will visit your property at the agreed time.' },
  { icon: Check, title: 'Free quote', desc: "You'll receive a detailed proposal and system recommendation — at no cost." },
];

const PAID_NEXT_STEPS = [
  { icon: Check, title: 'Payment received', desc: 'Your consultation slot is now reserved.' },
  { icon: Video, title: 'Video call link', desc: "We'll email your meeting link before the scheduled time." },
  { icon: Clock3, title: 'Meet your engineer', desc: 'Join the call and get expert solar guidance one-on-one.' },
];

async function getBooking(id: string): Promise<DbBooking | null> {
  try {
    const snap = await adminDb.collection('bookings').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<DbBooking, 'id'>) };
  } catch (e) {
    console.error('[confirmation getBooking]', e);
    return null;
  }
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; name?: string }>;
}) {
  const { id, name } = await searchParams;
  const booking = id ? await getBooking(id) : null;

  const displayName = booking?.name ?? (name ? decodeURIComponent(name) : 'there');
  const refNumber = id ? id.slice(0, 8).toUpperCase() : '—';

  const isPaid = booking?.payment_status === 'paid';
  const isAwaitingPayment = booking?.payment_status === 'pending';
  const steps = isPaid ? PAID_NEXT_STEPS : FREE_NEXT_STEPS;

  const heading = isPaid
    ? 'Payment Confirmed!'
    : isAwaitingPayment
      ? 'Almost There…'
      : 'Booking Received!';

  const subtext = isAwaitingPayment
    ? `Thanks ${displayName} — your booking is saved but payment isn't complete yet.`
    : `Thanks ${displayName}, we'll be in touch soon.`;

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
              <div className="w-20 h-20 bg-solar-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_0_8px_rgba(251,191,36,0.15)]">
                {isAwaitingPayment ? (
                  <Clock3 size={36} strokeWidth={3} className="text-navy-950" />
                ) : (
                  <Check size={36} strokeWidth={3} className="text-navy-950" />
                )}
              </div>
              <h1 className="text-white font-black text-3xl mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {heading}
              </h1>
              <p className="text-white/60 text-sm">{subtext}</p>
            </div>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Reference */}
            <div className="bg-solar-400/8 border border-solar-400/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Reference Number</p>
                <p className="text-navy-900 font-black text-lg tracking-widest font-mono">JMC-{refNumber}</p>
              </div>
              <div className="w-10 h-10 bg-solar-400/15 rounded-xl flex items-center justify-center">
                <span className="text-solar-600 text-lg">☀</span>
              </div>
            </div>

            {/* Payment summary (paid consultations) */}
            {isPaid && booking?.payment_amount != null && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-green-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-0.5">Paid</p>
                    <p className="text-navy-900 font-bold">
                      {formatCentavos(booking.payment_amount)}
                      {booking.duration_hours ? ` · ${booking.duration_hours}hr session` : ''}
                    </p>
                  </div>
                </div>
                <Check size={20} className="text-green-600" />
              </div>
            )}

            {/* Awaiting-payment notice */}
            {isAwaitingPayment && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <p className="text-sm text-amber-800">
                  We haven&apos;t received your payment yet. If you closed the payment page,
                  you can start a new booking or contact us to complete it.
                </p>
              </div>
            )}

            {/* What happens next */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">What Happens Next</p>
              <div className="space-y-4">
                {steps.map(({ icon: Icon, title, desc }, i) => (
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
