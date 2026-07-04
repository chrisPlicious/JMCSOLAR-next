import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Firebase Admin mock -----------------------------------------------------
// recordStockChange() writes to adminDb.collection('stockAudit').doc(). We stub
// the chain so no real Firestore is touched and capture the staged document.
const { setSpy, fakeRef, docSpy, collectionSpy } = vi.hoisted(() => {
  const setSpy = vi.fn();
  const fakeRef = { id: 'audit-id-123', set: setSpy };
  const docSpy = vi.fn(() => fakeRef);
  const collectionSpy = vi.fn((_name: string) => ({ doc: docSpy }));
  return { setSpy, fakeRef, docSpy, collectionSpy };
});

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: collectionSpy,
  },
}));

import {
  isLowStock,
  recordStockChange,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from './inventory';

describe('isLowStock', () => {
  it('returns true when stock is below the threshold', () => {
    expect(isLowStock(2, 5)).toBe(true);
  });

  it('returns true when stock equals the threshold (boundary)', () => {
    expect(isLowStock(5, 5)).toBe(true);
  });

  it('returns false when stock is above the threshold', () => {
    expect(isLowStock(6, 5)).toBe(false);
  });

  it('returns true when stock is 0', () => {
    expect(isLowStock(0, 5)).toBe(true);
  });

  it('uses DEFAULT_LOW_STOCK_THRESHOLD when threshold is null', () => {
    expect(DEFAULT_LOW_STOCK_THRESHOLD).toBe(5);
    expect(isLowStock(5, null)).toBe(true); // at default
    expect(isLowStock(6, null)).toBe(false); // above default
  });
});

describe('recordStockChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('without a transaction it writes the audit entry via ref.set and returns the id', async () => {
    const id = await recordStockChange({
      shopItemId: 'item-1',
      delta: -2,
      reason: 'sale',
      stockAfter: 8,
    });

    expect(id).toBe('audit-id-123');
    expect(collectionSpy).toHaveBeenCalledWith('stockAudit');
    expect(setSpy).toHaveBeenCalledTimes(1);

    const entry = setSpy.mock.calls[0][0];
    expect(entry).toMatchObject({
      id: 'audit-id-123',
      shop_item_id: 'item-1',
      variant_id: null, // defaults to null
      delta: -2,
      reason: 'sale',
      ref_id: null, // defaults to null
      actor: 'system', // defaults to 'system'
      stock_after: 8,
    });
    expect(typeof entry.created_at).toBe('string');
  });

  it('preserves explicit variant_id, ref_id and actor', async () => {
    await recordStockChange({
      shopItemId: 'item-1',
      variantId: 'var-9',
      delta: 5,
      reason: 'po_receive',
      refId: 'po-77',
      actor: 'admin@jmc.test',
      stockAfter: 20,
    });

    const entry = setSpy.mock.calls[0][0];
    expect(entry).toMatchObject({
      variant_id: 'var-9',
      ref_id: 'po-77',
      actor: 'admin@jmc.test',
      delta: 5,
      reason: 'po_receive',
      stock_after: 20,
    });
  });

  it('with a transaction it stages tx.set(ref, entry) instead of ref.set', async () => {
    const txSet = vi.fn();
    const tx = { set: txSet } as unknown as Parameters<typeof recordStockChange>[1];

    const id = await recordStockChange(
      { shopItemId: 'item-1', delta: -1, reason: 'sale', stockAfter: 3 },
      tx,
    );

    expect(id).toBe('audit-id-123');
    expect(setSpy).not.toHaveBeenCalled(); // no direct write
    expect(txSet).toHaveBeenCalledTimes(1);
    expect(txSet).toHaveBeenCalledWith(fakeRef, expect.objectContaining({
      id: 'audit-id-123',
      shop_item_id: 'item-1',
      delta: -1,
      reason: 'sale',
      stock_after: 3,
    }));
  });
});
