import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbShopItem } from '@/lib/firebase/types';
import { ManualOrderForm, type PickableItem } from '../_components/ManualOrderForm';

export const metadata = { title: 'New order — Admin' };
export const dynamic = 'force-dynamic';

/**
 * #19 — manual order creation (phone / walk-in).
 *
 * Only ACTIVE items are offered: `buildOrderLines` rejects inactive ones server-side,
 * so listing them would only produce a confusing failure at submit time.
 */
async function getPickableItems(): Promise<PickableItem[]> {
  const snap = await adminDb.collection('shopItems').get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DbShopItem, 'id'>) }))
    .filter((i) => i.active)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      price: i.price,
      stock: i.stock,
      variants: (i.variants ?? []).map((v) => ({
        id: v.id,
        label: v.label,
        sku: v.sku,
        price_centavos: v.price_centavos,
        stock: v.stock,
      })),
    }));
}

export default async function AdminNewOrderPage() {
  await requireAdminAuth();
  const items = await getPickableItems();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 transition-colors mb-5"
      >
        <ArrowLeft size={15} />
        All orders
      </Link>

      <div className="mb-5">
        <h1
          className="text-xl font-black text-navy-900"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          New manual order
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          For phone and walk-in sales. No payment link is created — record payment as
          already collected, or leave the order awaiting payment.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">
            No active shop items to sell.{' '}
            <Link href="/admin/shop-items" className="font-semibold text-navy-900 hover:underline">
              Add one first
            </Link>
            .
          </p>
        </div>
      ) : (
        <ManualOrderForm items={items} />
      )}
    </div>
  );
}
