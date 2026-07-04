import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { DbStockAuditEntry, DbStockChangeReason } from '@/lib/firebase/types';

// #14 — default low-stock threshold (units) used when an item has no per-item override.
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** Whether an item's current stock is at or below its low-stock threshold (#14). */
export function isLowStock(stock: number, lowStockThreshold: number | null): boolean {
  const threshold = lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  return stock <= threshold;
}

export interface RecordStockChangeInput {
  shopItemId: string;
  /** null for simple items; variant id when the change targets a specific variant. */
  variantId?: string | null;
  /** Signed delta: -2 (sale), +5 (PO receive), +1 (refund restore). */
  delta: number;
  reason: DbStockChangeReason;
  /** order id / PO id / import batch id (null when not applicable). */
  refId?: string | null;
  /** 'system' | 'webhook' | admin email. */
  actor?: string;
  /** Resulting stock after applying the delta (caller computes this). */
  stockAfter: number;
}

/**
 * #15 — Append a `stockAudit` row for a single stock mutation.
 *
 * Transaction-aware: when a Firestore transaction is supplied, the audit write is
 * staged on that transaction so it commits atomically with the stock mutation
 * (e.g. sale-decrement inside the orders webhook, PO receive, refund restore).
 * When called without a transaction it writes immediately on its own.
 *
 * Returns the new audit document id.
 */
export async function recordStockChange(
  input: RecordStockChangeInput,
  tx?: admin.firestore.Transaction,
): Promise<string> {
  const ref = adminDb.collection('stockAudit').doc();
  const entry: DbStockAuditEntry = {
    id: ref.id,
    shop_item_id: input.shopItemId,
    variant_id: input.variantId ?? null,
    delta: input.delta,
    reason: input.reason,
    ref_id: input.refId ?? null,
    actor: input.actor ?? 'system',
    stock_after: input.stockAfter,
    created_at: new Date().toISOString(),
  };

  if (tx) {
    tx.set(ref, entry);
  } else {
    await ref.set(entry);
  }

  return ref.id;
}
