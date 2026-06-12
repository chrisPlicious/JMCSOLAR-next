'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { simulatePaymentAction } from '../actions';
import { formatCentavos } from '@/lib/bookings/pricing';

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

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Test Mode · Simulated Checkout
          </p>
        </div>

        <div className="px-8 py-10 space-y-8 text-center">
          <div className="w-14 h-14 bg-navy-950 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-solar-400" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Amount Due</p>
            <p className="text-4xl font-serif text-navy-950">{formatCentavos(amountCentavos)}</p>
            <p className="text-sm text-slate-400 mt-2">Solar consultation booking</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-navy-950 text-white font-bold text-sm tracking-widest hover:bg-navy-800 transition-colors min-h-[52px] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                PROCESSING…
              </>
            ) : (
              'PAY NOW (SIMULATED)'
            )}
          </button>

          <Link
            href="/booking/consultation"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-navy-950 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={14} />
            Cancel and go back
          </Link>
        </div>
      </div>
    </main>
  );
}
