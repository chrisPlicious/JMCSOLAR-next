import { adminDb } from '@/lib/firebase/admin';
import type { DbOrderItem, DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

// Server-authoritative order line construction, shared by the storefront checkout
// (`createOrderAction`) and admin manual orders (`createManualOrderAction`).
//
// The caller is trusted ONLY for {shopItemId, variantId, quantity}. Price, name,
// SKU and stock are always re-read from Firestore here, so no caller — customer
// or admin — can influence what an item costs. Keeping this in one place is what
// stops a manual order from quietly pricing differently than a storefront one.

export type OrderLineInput = {
  shopItemId: string;
  variantId: string | null;
  quantity: number;
};

export type BuildOrderLinesResult =
  | { ok: true; items: DbOrderItem[]; subtotalCentavos: number }
  | { ok: false; error: string };

/**
 * Resolve cart lines into priced order items.
 *
 * Rejects the whole order when any line is invalid: unknown item, inactive item,
 * unknown variant, or insufficient stock. Stock is checked but NOT reserved —
 * the decrement happens later in `markOrderPaid`, inside a transaction that
 * re-reads stock, so a race can only ever result in a clamped decrement, never
 * an oversold ledger.
 */
export async function buildOrderLines(lines: OrderLineInput[]): Promise<BuildOrderLinesResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  const items: DbOrderItem[] = [];
  let subtotal = 0;

  for (const line of lines) {
    if (!line.shopItemId || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      return { ok: false, error: 'Invalid item in cart.' };
    }

    const snap = await adminDb.collection('shopItems').doc(line.shopItemId).get();
    if (!snap.exists) return { ok: false, error: 'One of the items is no longer available.' };
    const item = { id: snap.id, ...(snap.data() as Omit<DbShopItem, 'id'>) };
    if (!item.active) return { ok: false, error: `"${item.name}" is no longer available.` };

    let unitPrice: number;
    let available: number;
    let sku: string;
    let variant: DbShopItemVariant | null = null;

    if (line.variantId) {
      variant = (item.variants ?? []).find((v) => v.id === line.variantId) ?? null;
      if (!variant) return { ok: false, error: `A selected option for "${item.name}" is unavailable.` };
      unitPrice = variant.price_centavos;
      available = variant.stock;
      sku = variant.sku;
    } else {
      unitPrice = item.price;
      available = item.stock;
      sku = item.sku;
    }

    if (available < line.quantity) {
      return {
        ok: false,
        error: `Not enough stock for "${item.name}"${variant ? ` (${variant.label})` : ''}. Only ${available} left.`,
      };
    }

    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    items.push({
      shop_item_id: item.id,
      variant_id: line.variantId,
      name: variant ? `${item.name} — ${variant.label}` : item.name,
      sku,
      unit_price_centavos: unitPrice,
      quantity: line.quantity,
      line_total_centavos: lineTotal,
    });
  }

  return { ok: true, items, subtotalCentavos: subtotal };
}
