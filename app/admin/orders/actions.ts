'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { DbOrderStatus } from '@/lib/firebase/types';

type ActionResult = { error?: string; success?: boolean };

// Allowed order statuses. Mirrors DbOrderStatus — validated server-side so a
// client can never write an arbitrary value.
const ORDER_STATUSES: DbOrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
];

/**
 * Transition an order to a new status. Admin-only.
 *
 * Read-only beyond the status change: this does NOT touch payment, stock, or
 * refunds (those live in later Phase 5 work). It only sets `status` + `updated_at`.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: DbOrderStatus,
): Promise<ActionResult> {
  await requireAdminAuth();

  if (!orderId) return { error: 'Missing order id.' };
  if (!ORDER_STATUSES.includes(newStatus)) {
    return { error: 'Invalid order status.' };
  }

  const ref = adminDb.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Order not found.' };

  try {
    await ref.update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    console.error('[updateOrderStatusAction]', e);
    return { error: 'Failed to update order status.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/orders/' + orderId);
  return { success: true };
}
