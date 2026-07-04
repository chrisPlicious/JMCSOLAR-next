import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbOrder } from '@/lib/firebase/types';
import {
  ORDER_STATUS_STYLES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  SOURCE_STYLES,
  SOURCE_LABELS,
  FULFILLMENT_LABELS,
} from './_components/order-meta';

export const metadata = { title: 'Orders — Admin' };
export const dynamic = 'force-dynamic';

// Cap to a reasonable page size. Pagination (cursor over created_at) can be
// added later once order volume grows.
const PAGE_SIZE = 100;

async function getOrders(): Promise<DbOrder[]> {
  const snap = await adminDb
    .collection('orders')
    .orderBy('created_at', 'desc')
    .limit(PAGE_SIZE)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DbOrder);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AdminOrdersPage() {
  await requireAdminAuth();
  const orders = await getOrders();

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-navy-950 text-2xl">Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!orders.length ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300">
                <path d="M3 6h18l-1.5 12a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6V5a4 4 0 018 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium text-sm mb-1">No orders yet</p>
            <p className="text-slate-300 text-xs">Customer orders will appear here.</p>
          </div>
        </div>
      ) : (
        /* Orders table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Reference</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Customer</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Items</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Total</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Status</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Payment</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Source</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Fulfillment</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const ref = `JMC-${order.id.slice(0, 8).toUpperCase()}`;
                const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                  >
                    {/* Reference */}
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy-900">{ref}</td>

                    {/* Customer */}
                    <td className="px-4 py-3 font-medium text-navy-900">{order.customer.name}</td>

                    {/* Item count */}
                    <td className="px-4 py-3 text-slate-500">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-navy-900 font-medium">{formatCentavos(order.total_centavos)}</td>

                    {/* Order status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ORDER_STATUS_STYLES[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>

                    {/* Payment status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PAYMENT_STATUS_STYLES[order.payment_status]}`}>
                        {PAYMENT_STATUS_LABELS[order.payment_status]}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SOURCE_STYLES[order.source]}`}>
                        {SOURCE_LABELS[order.source]}
                      </span>
                    </td>

                    {/* Fulfillment */}
                    <td className="px-4 py-3 text-slate-500">{FULFILLMENT_LABELS[order.fulfillment_method]}</td>

                    {/* Created date */}
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(order.created_at)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
