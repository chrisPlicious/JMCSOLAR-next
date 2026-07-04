import Link from 'next/link';
import { Check, Clock3, CreditCard, Home, ArrowRight, Truck, Store } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { reconcileOrderPayment } from '@/lib/shop/orders';
import { formatCentavos } from '@/lib/bookings/pricing';
import ClearCartOnPaid from '@/components/shop/ClearCartOnPaid';
import PendingOrderPoller from '@/components/shop/PendingOrderPoller';
import type { DbOrder } from '@/lib/firebase/types';

// Never cache: each visit re-runs verify-on-return reconciliation so a payment that
// landed (or is about to) is reflected immediately.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Order Confirmation — JMC Solar PH',
};

const REGION_LABELS: Record<string, string> = {
  ormoc_city: 'Ormoc City',
  ormoc_far: 'Ormoc (far barangay)',
  leyte_province: 'Leyte (province)',
  visayas: 'Visayas',
  luzon: 'Luzon / Metro Manila',
  mindanao: 'Mindanao',
};

async function getOrder(id: string): Promise<DbOrder | null> {
  try {
    const snap = await adminDb.collection('orders').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<DbOrder, 'id'>) };
  } catch (e) {
    console.error('[shop confirmation getOrder]', e);
    return null;
  }
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let order = id ? await getOrder(id) : null;

  // Verify-on-return: if the order is still awaiting payment, ask the provider whether
  // the checkout session actually paid and flip it (works on localhost AND prod).
  if (id && order?.payment_status === 'pending') {
    order = await reconcileOrderPayment(id);
  }

  const refNumber = id ? id.slice(0, 8).toUpperCase() : '—';
  const isPaid = order?.payment_status === 'paid';
  const isAwaitingPayment = order?.payment_status === 'pending';

  const heading = isPaid ? 'Order Confirmed!' : isAwaitingPayment ? 'Almost There…' : 'Order Received!';
  const displayName = order?.customer.name ?? 'there';
  const subtext = isAwaitingPayment
    ? `Thanks ${displayName} — your order is saved but payment isn't complete yet.`
    : `Thanks ${displayName}, we've got your order.`;

  const fulfillmentLabel =
    order?.fulfillment_method === 'pickup'
      ? 'Store pickup (Ormoc)'
      : `Delivery${order?.shipping_region ? ` · ${REGION_LABELS[order.shipping_region] ?? order.shipping_region}` : ''}`;

  // Clear the cart once the customer has actually been through checkout (the order
  // carries a payment_session_id) — not only when paid, so a closed/3DS-delayed tab
  // still empties the cart on return.
  const wentThroughCheckout = Boolean(order?.payment_session_id);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center">
      {wentThroughCheckout && <ClearCartOnPaid />}
      {isAwaitingPayment && <PendingOrderPoller />}
      <div className="w-full max-w-lg mx-auto px-4 py-24">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
          {/* Header */}
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

            {/* Paid summary */}
            {isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-green-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-0.5">Paid</p>
                    <p className="text-navy-900 font-bold">{order && formatCentavos(order.total_centavos)}</p>
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
                  you can start checkout again or contact us to complete it.
                </p>
              </div>
            )}

            {/* Order details */}
            {order && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Order Details</p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-600 pr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-navy-900 shrink-0">
                        {formatCentavos(item.line_total_centavos)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-slate-100 my-4" />
                <div className="flex justify-between text-sm text-slate-600 mb-1.5">
                  <span>Subtotal</span>
                  <span className="font-semibold text-navy-900">{formatCentavos(order.subtotal_centavos)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 mb-3">
                  <span>Shipping</span>
                  <span className="font-semibold text-navy-900">
                    {order.shipping_centavos === 0 ? 'Free' : formatCentavos(order.shipping_centavos)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <span className="font-bold text-navy-900">Total</span>
                  <span className="font-black text-navy-900 text-lg">{formatCentavos(order.total_centavos)}</span>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                  {order.fulfillment_method === 'pickup' ? (
                    <Store size={16} className="text-navy-700" />
                  ) : (
                    <Truck size={16} className="text-navy-700" />
                  )}
                  <span>{fulfillmentLabel}</span>
                </div>
              </div>
            )}

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
                href="/shop"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-navy-700 font-semibold text-sm hover:bg-slate-50 transition-colors min-h-[44px] flex-1"
              >
                Continue shopping
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
