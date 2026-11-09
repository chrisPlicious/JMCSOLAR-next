import { Check, Calendar, Phone, ArrowRight, Home, Video, Clock3, CreditCard } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import type { DbBooking } from '@/lib/firebase/types';
import { formatCentavos } from '@/lib/bookings/pricing';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import StatusCard from '@/components/ui/StatusCard';
import { BUSINESS } from '@/lib/seo/business';

export const metadata = {
  title: 'Booking Confirmed',
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

  // The booking layout renders the fixed navbar, so the band clears it here.
  return (
    <Section as="main" tone="tint" container="narrow" className="flex min-h-screen items-center pt-28 sm:pt-32">
      <StatusCard
        tone={isAwaitingPayment ? 'pending' : 'success'}
        title={heading}
        subtitle={subtext}
        actions={
          <>
            <Button href="/services" variant="outline">
              Our services
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button href="/" variant="secondary">
              <Home className="size-4" aria-hidden />
              Back to home
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          {/* Reference */}
          <div className="rounded-control border border-line bg-navy-50 px-5 py-4">
            <p className="mb-0.5 text-xs font-semibold text-fg-muted">Reference number</p>
            <p className="font-mono text-lg font-bold tracking-widest text-fg tabular-nums">JMC-{refNumber}</p>
          </div>

          {/* Payment summary (paid consultations) */}
          {isPaid && booking?.payment_amount != null && (
            <div className="flex items-center justify-between rounded-control border border-green-200 bg-green-eco-bg px-5 py-4">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-green-700" aria-hidden />
                <div>
                  <p className="mb-0.5 text-xs font-semibold text-green-800">Paid</p>
                  <p className="font-bold text-fg tabular-nums">
                    {formatCentavos(booking.payment_amount)}
                    {booking.duration_hours ? ` · ${booking.duration_hours}hr session` : ''}
                  </p>
                </div>
              </div>
              <Check className="size-5 text-green-700" aria-hidden />
            </div>
          )}

          {/* Awaiting-payment notice */}
          {isAwaitingPayment && (
            <div className="rounded-control border border-solar-200 bg-solar-50 px-5 py-4">
              <p className="text-sm text-fg">
                We haven&apos;t received your payment yet. If you closed the payment page,
                you can start a new booking or contact us to complete it.
              </p>
            </div>
          )}

          {/* What happens next */}
          <div>
            <h2 className="mb-4 text-title text-fg">What happens next</h2>
            <ul className="space-y-4">
              {steps.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-navy-50 text-navy-700">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-sm text-fg-subtle">
            Questions? Call us at{' '}
            <a href={`tel:${BUSINESS.phone.e164}`} className="font-semibold text-solar-ink hover:underline">
              {BUSINESS.phone.display}
            </a>
          </p>
        </div>
      </StatusCard>
    </Section>
  );
}
