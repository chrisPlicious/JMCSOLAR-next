import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DbOrderStatus } from '@/lib/firebase/types';

// updateOrderStatusAction is admin-only and read-only beyond the status change. We
// mock requireAdminAuth (auth gate), adminDb (the order doc), and revalidatePath so
// the action runs with no IO and we can assert exactly what it writes.
const h = vi.hoisted(() => {
  const orderUpdateSpy = vi.fn(async (..._a: unknown[]) => undefined);
  let orderExists = true;
  const orderRef = {
    get: async () => ({ exists: orderExists, id: 'order-1', data: () => ({ status: 'pending' }) }),
    update: orderUpdateSpy,
  };
  const collectionSpy = vi.fn((name: string) => {
    if (name === 'orders') return { doc: (_id: string) => orderRef };
    throw new Error(`unexpected collection ${name}`);
  });
  const requireAdminAuth = vi.fn(async () => undefined);
  const revalidatePath = vi.fn();
  return {
    orderUpdateSpy,
    collectionSpy,
    requireAdminAuth,
    revalidatePath,
    setOrderExists: (v: boolean) => {
      orderExists = v;
    },
  };
});

vi.mock('@/lib/auth', () => ({ requireAdminAuth: h.requireAdminAuth }));
vi.mock('@/lib/firebase/admin', () => ({ adminDb: { collection: h.collectionSpy } }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));

import { updateOrderStatusAction } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
  h.setOrderExists(true);
  h.requireAdminAuth.mockResolvedValue(undefined);
});

describe('updateOrderStatusAction', () => {
  it('updates status + updated_at and revalidates on a valid transition', async () => {
    const result = await updateOrderStatusAction('order-1', 'shipped');

    expect(result).toEqual({ success: true });
    expect(h.orderUpdateSpy).toHaveBeenCalledTimes(1);
    const patch = h.orderUpdateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(patch.status).toBe('shipped');
    expect(typeof patch.updated_at).toBe('string');
    expect(h.revalidatePath).toHaveBeenCalledWith('/admin/orders');
    expect(h.revalidatePath).toHaveBeenCalledWith('/admin/orders/order-1');
  });

  it('rejects an invalid status without touching the order', async () => {
    const result = await updateOrderStatusAction('order-1', 'bogus' as DbOrderStatus);

    expect(result).toEqual({ error: 'Invalid order status.' });
    expect(h.orderUpdateSpy).not.toHaveBeenCalled();
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a missing order id', async () => {
    const result = await updateOrderStatusAction('', 'paid');
    expect(result).toEqual({ error: 'Missing order id.' });
    expect(h.orderUpdateSpy).not.toHaveBeenCalled();
  });

  it('errors when the order does not exist', async () => {
    h.setOrderExists(false);
    const result = await updateOrderStatusAction('order-1', 'paid');

    expect(result).toEqual({ error: 'Order not found.' });
    expect(h.orderUpdateSpy).not.toHaveBeenCalled();
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('returns an error result when the update write fails', async () => {
    h.orderUpdateSpy.mockRejectedValueOnce(new Error('firestore down'));
    const result = await updateOrderStatusAction('order-1', 'delivered');

    expect(result).toEqual({ error: 'Failed to update order status.' });
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it('propagates an auth failure when requireAdminAuth throws', async () => {
    h.requireAdminAuth.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(updateOrderStatusAction('order-1', 'paid')).rejects.toThrow('Unauthorized');
    expect(h.collectionSpy).not.toHaveBeenCalled();
    expect(h.orderUpdateSpy).not.toHaveBeenCalled();
  });
});
