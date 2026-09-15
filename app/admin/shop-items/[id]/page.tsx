import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { DbShopItem } from '@/lib/firebase/types';
import ShopItemForm from '../_components/ShopItemForm';
import StockAuditLog from '../_components/StockAuditLog';

export const dynamic = 'force-dynamic';

export default async function EditShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await adminDb.collection('shopItems').doc(id).get();
  if (!snap.exists) notFound();
  const item = { id: snap.id, ...(snap.data() as Omit<DbShopItem, 'id'>) };
  return (
    <>
      <ShopItemForm item={item} imageUrl={getPublicUrl(item.image_path)} />
      {/* #15 — stock history for this item */}
      <StockAuditLog item={item} />
    </>
  );
}
