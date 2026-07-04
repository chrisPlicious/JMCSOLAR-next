import type { DbShopItemVariant } from '@/lib/firebase/types';

/** lowercase, dash-separated, alphanumeric slug derived from arbitrary text. */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse a peso amount (string from the form) into integer centavos. Returns null if invalid. */
export function pesosToCentavos(raw: string | null): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Parse a non-negative integer field. Returns null if missing; returns NaN-guard via the second tuple slot. */
export function parseNonNegInt(raw: string | null): { value: number | null; valid: boolean } {
  if (raw == null || raw === '') return { value: null, valid: true };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return { value: null, valid: false };
  return { value: n, valid: true };
}

export type VariantRowInput = {
  id?: string;
  label?: string;
  sku?: string;
  price?: string;
  stock?: string;
};

/**
 * Parse + validate the variants payload (a JSON array string from the form's hidden input).
 * Returns the typed variant list (centavos) or an error message. Empty/absent → null (simple item).
 */
export function parseVariants(raw: string | null): {
  variants: DbShopItemVariant[] | null;
  error?: string;
} {
  if (!raw || raw.trim() === '' || raw.trim() === '[]') return { variants: null };

  let parsed: VariantRowInput[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { variants: null, error: 'Variants payload is malformed.' };
  }
  if (!Array.isArray(parsed)) return { variants: null, error: 'Variants payload is malformed.' };
  if (parsed.length === 0) return { variants: null };

  const variants: DbShopItemVariant[] = [];
  for (const row of parsed) {
    const label = (row.label ?? '').trim();
    const sku = (row.sku ?? '').trim();
    if (!label) return { variants: null, error: 'Each variant needs a label.' };
    if (!sku) return { variants: null, error: `Variant "${label}" needs a SKU.` };

    const priceCentavos = pesosToCentavos(row.price ?? null);
    if (priceCentavos == null) return { variants: null, error: `Variant "${label}" needs a valid price.` };

    const stock = parseNonNegInt(row.stock ?? null);
    if (!stock.valid || stock.value == null) {
      return { variants: null, error: `Variant "${label}" needs a valid stock count.` };
    }

    variants.push({
      id: row.id && row.id.trim() ? row.id : crypto.randomUUID(),
      label,
      sku,
      price_centavos: priceCentavos,
      stock: stock.value,
    });
  }
  return { variants };
}
