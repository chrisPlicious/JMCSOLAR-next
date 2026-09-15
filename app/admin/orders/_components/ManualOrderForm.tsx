'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCentavos } from '@/lib/bookings/pricing';
import {
  getShippingFee,
  regionShippingFees,
  REGION_LABELS,
  REGION_KEYS,
} from '@/lib/shop/shipping';
import type { DbFulfillmentMethod } from '@/lib/firebase/types';
import { createManualOrderAction } from '../actions';

/** Trimmed shop-item shape the picker needs — built server-side in new/page.tsx. */
export type PickableItem = {
  id: string;
  name: string;
  sku: string;
  price: number; // centavos, base
  stock: number; // base stock
  variants: { id: string; label: string; sku: string; price_centavos: number; stock: number }[];
};

type Line = { key: string; shopItemId: string; variantId: string | null; quantity: number };

const newLine = (): Line => ({
  key: crypto.randomUUID(),
  shopItemId: '',
  variantId: null,
  quantity: 1,
});

export function ManualOrderForm({ items }: { items: PickableItem[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fulfillmentMethod, setMethod] = useState<DbFulfillmentMethod>('pickup');
  const [region, setRegion] = useState(REGION_KEYS[0] ?? '');
  const [markPaid, setMarkPaid] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  /** Resolve a line's unit price + available stock. Mirrors the server's rules — display only. */
  function resolve(line: Line): { unit: number; available: number; label: string } | null {
    const item = byId.get(line.shopItemId);
    if (!item) return null;
    if (line.variantId) {
      const v = item.variants.find((x) => x.id === line.variantId);
      if (!v) return null;
      return { unit: v.price_centavos, available: v.stock, label: `${item.name} — ${v.label}` };
    }
    return { unit: item.price, available: item.stock, label: item.name };
  }

  const subtotal = lines.reduce((sum, l) => {
    const r = resolve(l);
    return r ? sum + r.unit * l.quantity : sum;
  }, 0);
  const shipping = getShippingFee(region, fulfillmentMethod);
  const total = subtotal + shipping;

  // Client-side mirror of the server's guards, so the admin sees problems before submitting.
  // The server re-validates everything regardless — this is convenience, not enforcement.
  const overStock = lines.some((l) => {
    const r = resolve(l);
    return r != null && l.quantity > r.available;
  });
  const complete =
    lines.length > 0 &&
    lines.every((l) => l.shopItemId && l.quantity > 0 && resolve(l) != null) &&
    name.trim() !== '' &&
    phone.trim() !== '' &&
    (fulfillmentMethod === 'pickup' || (address.trim() !== '' && region !== ''));

  function update(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await createManualOrderAction({
        lines: lines.map((l) => ({
          shopItemId: l.shopItemId,
          variantId: l.variantId,
          quantity: l.quantity,
        })),
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
        },
        region,
        fulfillmentMethod,
        markPaid,
        notifyCustomer,
      });

      if ('error' in res) {
        setError(res.error);
        return;
      }
      toast.success('Manual order created.');
      router.push(`/admin/orders/${res.orderId}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Items */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Items</p>

        <div className="space-y-3">
          {lines.map((line) => {
            const item = byId.get(line.shopItemId);
            const r = resolve(line);
            const lineOver = r != null && line.quantity > r.available;
            return (
              <div key={line.key} className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
                <select
                  value={line.shopItemId}
                  onChange={(e) => update(line.key, { shopItemId: e.target.value, variantId: null })}
                  disabled={isPending}
                  className="flex-1 min-w-[12rem] text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
                >
                  <option value="">Select an item…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>

                {item && item.variants.length > 0 && (
                  <select
                    value={line.variantId ?? ''}
                    onChange={(e) => update(line.key, { variantId: e.target.value || null })}
                    disabled={isPending}
                    className="min-w-[9rem] text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
                  >
                    <option value="">Select an option…</option>
                    {item.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} ({v.stock} left)
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(e) => update(line.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  disabled={isPending}
                  aria-label="Quantity"
                  className={`w-20 text-sm text-navy-900 border rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50 ${
                    lineOver ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />

                <div className="w-24 text-sm text-right pt-2 font-medium text-navy-900 shrink-0">
                  {r ? formatCentavos(r.unit * line.quantity) : '—'}
                </div>

                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  disabled={isPending || lines.length === 1}
                  aria-label="Remove line"
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-colors disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {overStock && (
          <p className="text-xs text-red-600 mt-3">
            One or more lines exceed available stock. Reduce the quantity — the server will
            reject the order otherwise.
          </p>
        )}

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, newLine()])}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors mt-4 disabled:opacity-50"
        >
          <Plus size={15} />
          Add item
        </button>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Customer</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Name *" value={name} onChange={setName} disabled={isPending} />
          <Input label="Phone *" value={phone} onChange={setPhone} disabled={isPending} />
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            disabled={isPending}
            hint="Optional — walk-ins often have none. No email means no receipt."
          />
          <Input
            label={fulfillmentMethod === 'delivery' ? 'Address *' : 'Address'}
            value={address}
            onChange={setAddress}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Fulfillment + payment */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Fulfillment &amp; payment
        </p>

        <div className="flex gap-2">
          {(['pickup', 'delivery'] as DbFulfillmentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              disabled={isPending}
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 ${
                fulfillmentMethod === m
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {m === 'pickup' ? 'Store pickup' : 'Delivery'}
            </button>
          ))}
        </div>

        {fulfillmentMethod === 'delivery' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isPending}
              className="w-full text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
            >
              {REGION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {REGION_LABELS[k] ?? k} — {formatCentavos(regionShippingFees[k])}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={markPaid}
            onChange={(e) => setMarkPaid(e.target.checked)}
            disabled={isPending}
            className="mt-0.5"
          />
          <span className="text-sm text-navy-900">
            Payment already collected
            <span className="block text-xs text-slate-400">
              Marks the order paid and decrements stock now. Leave unchecked to keep it
              awaiting payment — stock is only decremented once it is paid.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            disabled={isPending || email.trim() === ''}
            className="mt-0.5"
          />
          <span className="text-sm text-navy-900">
            Email the customer
            <span className="block text-xs text-slate-400">
              {email.trim() === ''
                ? 'Needs an email address above.'
                : markPaid
                  ? 'Sends the paid receipt.'
                  : 'Sends an order-received acknowledgement.'}
            </span>
          </span>
        </label>
      </div>

      {/* Totals + submit */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="space-y-1.5 mb-4">
          <Row label="Subtotal" value={formatCentavos(subtotal)} />
          <Row label="Shipping" value={formatCentavos(shipping)} />
          <div className="flex items-center justify-between text-base pt-2 border-t border-slate-100">
            <span className="font-semibold text-navy-900">Total</span>
            <span className="font-black text-navy-900">{formatCentavos(total)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Prices shown are from the catalogue for reference — the server recomputes every
          line when the order is created.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !complete || overStock}
          className="w-full text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create order'}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full text-sm text-navy-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300 disabled:opacity-50"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}
