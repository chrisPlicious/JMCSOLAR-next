'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingBag, ArrowLeft, Truck, Store } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { formatCentavos } from '@/lib/bookings/pricing';
import { getShippingFee, regionShippingFees } from '@/lib/shop/shipping';
import { useCart } from '@/components/shop/CartContext';
import { createOrderAction } from '../actions';
import type { FulfillmentMethod } from '@/types';

// Friendly labels for the region keys defined in lib/shop/shipping.ts.
const REGION_LABELS: Record<string, string> = {
  ormoc_city: 'Ormoc City',
  ormoc_far: 'Ormoc (far barangay)',
  leyte_province: 'Leyte (province)',
  visayas: 'Visayas (Cebu, Iloilo, etc.)',
  luzon: 'Luzon / Metro Manila',
  mindanao: 'Mindanao',
};

const REGION_KEYS = Object.keys(regionShippingFees);

// #12 — saved checkout info (this device only, no account).
const SAVED_KEY = 'jmc-shop-checkout';

type SavedInfo = { name: string; email: string; phone: string; address: string };

export default function CheckoutPage() {
  const { items, hydrated, subtotalCentavos } = useCart();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState(REGION_KEYS[0] ?? '');
  const [method, setMethod] = useState<FulfillmentMethod>('delivery');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill from localStorage on mount (#12).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<SavedInfo>;
      if (saved.name) setName(saved.name);
      if (saved.email) setEmail(saved.email);
      if (saved.phone) setPhone(saved.phone);
      if (saved.address) setAddress(saved.address);
    } catch {
      // ignore malformed storage
    }
  }, []);

  const shipping = getShippingFee(region, method);
  const total = subtotalCentavos + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    const result = await createOrderAction({
      cartItems: items.map((l) => ({
        shopItemId: l.shopItemId,
        variantId: l.variantId,
        quantity: l.quantity,
      })),
      customer: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: method === 'delivery' ? address.trim() : null,
      },
      region,
      fulfillmentMethod: method,
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Persist saved info on success (#12).
    try {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() }),
      );
    } catch {
      // ignore storage failures
    }

    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    router.push(`/shop/confirmation?id=${result.orderId}`);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
            <Link href="/" className="hover:text-navy-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-navy-900 transition-colors">Shop</Link>
            <span>/</span>
            <Link href="/shop/cart" className="hover:text-navy-900 transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-navy-900">Checkout</span>
          </div>

          <h1 className="text-navy-950 font-black text-3xl sm:text-4xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Checkout
          </h1>

          {!hydrated ? (
            <div className="text-slate-400 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={44} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500 mb-6">Your cart is empty.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <ArrowLeft size={18} /> Browse the shop
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
              {/* Customer + fulfillment */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="font-bold text-navy-900 text-lg">Your details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-600">Full name</span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-solar-400 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-600">Phone</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-solar-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-600">Email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-solar-400 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="font-bold text-navy-900 text-lg">Fulfillment</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('delivery')}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        method === 'delivery' ? 'border-solar-400 bg-solar-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Truck size={20} className="text-navy-700 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-navy-900">Delivery</p>
                        <p className="text-xs text-slate-500">Shipped to your address</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('pickup')}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        method === 'pickup' ? 'border-solar-400 bg-solar-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Store size={20} className="text-navy-700 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-navy-900">Store pickup</p>
                        <p className="text-xs text-slate-500">Free · collect in Ormoc</p>
                      </div>
                    </button>
                  </div>

                  {method === 'delivery' && (
                    <>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-600">Delivery address</span>
                        <textarea
                          required
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-solar-400 focus:outline-none resize-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-600">Region</span>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-solar-400 focus:outline-none bg-white"
                        >
                          {REGION_KEYS.map((key) => (
                            <option key={key} value={key}>
                              {REGION_LABELS[key] ?? key} — {formatCentavos(regionShippingFees[key])}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="font-bold text-navy-900 text-lg mb-4">Order summary</h2>
                <div className="space-y-2 mb-4">
                  {items.map((line) => (
                    <div key={`${line.shopItemId}::${line.variantId ?? ''}`} className="flex justify-between text-sm">
                      <span className="text-slate-600 line-clamp-1 pr-2">
                        {line.name}
                        {line.variantLabel ? ` · ${line.variantLabel}` : ''} × {line.quantity}
                      </span>
                      <span className="font-semibold text-navy-900 shrink-0">
                        {formatCentavos(line.unitPriceCentavos * line.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-slate-100 mb-4" />
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Subtotal</span>
                  <span className="font-semibold text-navy-900">{formatCentavos(subtotalCentavos)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                  <span>Shipping</span>
                  <span className="font-semibold text-navy-900">
                    {shipping === 0 ? 'Free' : formatCentavos(shipping)}
                  </span>
                </div>
                <div className="h-px bg-slate-100 mb-4" />
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-navy-900">Total</span>
                  <span className="font-black text-navy-900 text-lg">{formatCentavos(total)}</span>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg mb-4" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Placing order…
                    </>
                  ) : (
                    'Place order'
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
                  Prices and stock are re-validated server-side before payment.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
