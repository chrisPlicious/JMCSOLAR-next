'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { simulatePaymentAction } from '../actions';
import { formatCentavos } from '@/lib/bookings/pricing';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/Field';
import { Section } from '@/components/ui/Section';
import StatusCard from '@/components/ui/StatusCard';

/**
 * Simulated checkout — stands in for the PayMongo hosted checkout while the
 * stub provider is active. Mirrors the real redirect → pay → return flow.
 */
export default function StubCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; amount?: string }>;
}) {
  const { booking, amount } = use(searchParams);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amountCentavos = Number(amount) || 0;

  const pay = async () => {
    if (!booking) {
      setError('Missing booking reference.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await simulatePaymentAction(booking);
    if ('error' in result) {
      setLoading(false);
      setError(result.error);
      return;
    }
    router.push(`/booking/confirmation?id=${booking}`);
  };

  // The booking layout renders the fixed navbar, so the band clears it here.
  return (
    <Section as="main" tone="tint" container="narrow" className="flex min-h-screen items-center pt-28 sm:pt-32">
      <StatusCard
        tone="pending"
        title="Complete your payment"
        subtitle="Solar consultation booking"
        actions={
          <>
            <Button href="/booking/consultation" variant="ghost">
              <ChevronLeft className="size-4" aria-hidden />
              Cancel and go back
            </Button>
            <Button variant="secondary" onClick={pay} loading={loading}>
              {loading ? 'Processing…' : 'Pay now (simulated)'}
            </Button>
          </>
        }
      >
        <div className="space-y-6 text-center">
          <Badge tone="solar" caps>
            Test mode · Simulated checkout
          </Badge>
          <div>
            <p className="mb-1 text-sm font-semibold text-fg-subtle">Amount due</p>
            <p className="font-display text-h1 text-fg tabular-nums">{formatCentavos(amountCentavos)}</p>
          </div>
          <FieldError role="alert" className="mt-0 justify-center rounded-control bg-red-50 px-4 py-3 text-left">
            {error}
          </FieldError>
        </div>
      </StatusCard>
    </Section>
  );
}
