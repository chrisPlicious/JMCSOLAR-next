import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbOrder } from '@/lib/firebase/types';
import { OrderStatusControl } from '../_components/OrderStatusControl';
import {
  ORDER_STATUS_STYLES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  SOURCE_STYLES,
  SOURCE_LABELS,
  RETURN_STATUS_STYLES,
  RETURN_STATUS_LABELS,
  FULFILLMENT_LABELS,
} from '../_components/order-meta';

export const metadata = { title: 'Order — Admin' };
export const dynamic = 'force-dynamic';

async function getOrder(id: string): Promise<DbOrder | null> {
  const snap = await adminDb.collection('orders').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as DbOrder;
}

function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-navy-900 break-words min-w-0">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      <div>{children}</div>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const ref = `JMC-${order.id.slice(0, 8).toUpperCase()}`;
  const paymongoUrl = order.payment_reference
    ? `https://dashboard.paymongo.com/payments/${order.payment_reference}`
    : null;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 transition-colors mb-5"
      >
        <ArrowLeft size={15} />
        All orders
      </Link>

      <div className="space-y-4">
        {/* Identity + status control */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-navy-900 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {ref}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[order.payment_status]}`}>
                  {PAYMENT_STATUS_LABELS[order.payment_status]}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${SOURCE_STYLES[order.source]}`}>
                  {SOURCE_LABELS[order.source]}
                </span>
                {order.return_status !== 'none' && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${RETURN_STATUS_STYLES[order.return_status]}`}>
                    Return: {RETURN_STATUS_LABELS[order.return_status]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Placed {fmtDate(order.created_at, true)}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Order status</p>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </div>
        </div>

        {/* Customer */}
        <Section title="Customer">
          <Field label="Name" value={order.customer.name} />
          <Field label="Email" value={order.customer.email} />
          <Field label="Phone" value={order.customer.phone} />
          <Field label="Address" value={order.customer.address} />
        </Section>

        {/* Line items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Items</p>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">Item</th>
                  <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">Variant</th>
                  <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-right">Qty</th>
                  <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-right">Unit</th>
                  <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={`${it.shop_item_id}-${it.variant_id ?? 'base'}-${idx}`} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-navy-900">{it.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{it.sku}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{it.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatCentavos(it.unit_price_centavos)}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-navy-900">{formatCentavos(it.line_total_centavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-navy-900">{formatCentavos(order.subtotal_centavos)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Shipping</span>
              <span className="font-medium text-navy-900">{formatCentavos(order.shipping_centavos)}</span>
            </div>
            <div className="flex items-center justify-between text-base pt-2 border-t border-slate-100">
              <span className="font-semibold text-navy-900">Total</span>
              <span className="font-black text-navy-900">{formatCentavos(order.total_centavos)}</span>
            </div>
          </div>
        </div>

        {/* Fulfillment */}
        <Section title="Fulfillment">
          <Field label="Method" value={FULFILLMENT_LABELS[order.fulfillment_method]} />
          <Field label="Shipping region" value={order.shipping_region} />
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <Field label="Status" value={PAYMENT_STATUS_LABELS[order.payment_status]} />
          <Field label="Payment ID" value={order.payment_reference} />
          <Field label="Session ID" value={order.payment_session_id} />
          {order.paid_at && <Field label="Paid at" value={fmtDate(order.paid_at, true)} />}
          {order.refund_id && <Field label="Refund ID" value={order.refund_id} />}
          {order.refund_amount != null && <Field label="Refunded" value={formatCentavos(order.refund_amount)} />}
          {order.refunded_at && <Field label="Refunded at" value={fmtDate(order.refunded_at, true)} />}
          {paymongoUrl && (
            <a
              href={paymongoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors mt-3"
            >
              Open in PayMongo dashboard
            </a>
          )}
        </Section>
      </div>
    </div>
  );
}
