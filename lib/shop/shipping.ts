import type { FulfillmentMethod } from '@/types';

// Shipping fees in centavos (PayMongo unit). ₱500 = 50000.
// Regions centered on Ormoc City / Leyte (Visayas), mirroring the site-assessment
// tier logic from lib/bookings/pricing.ts.
// NOTE: these region keys and fees are placeholders pending client confirmation —
// adjust based on actual delivery zones and pricing strategy.
export const regionShippingFees: Record<string, number> = {
  ormoc_city: 30000, // ₱300 — Ormoc City proper
  ormoc_far: 60000, // ₱600 — Ormoc far barangay
  leyte_province: 100000, // ₱1,000 — other parts of Leyte
  visayas: 150000, // ₱1,500 — wider Visayas region (Cebu, Iloilo, etc.)
  luzon: 200000, // ₱2,000 — Metro Manila, Luzon
  mindanao: 200000, // ₱2,000 — Mindanao
};

// Friendly labels for the region keys above. Shared by the storefront checkout and
// the admin manual-order form so the two never drift apart.
export const REGION_LABELS: Record<string, string> = {
  ormoc_city: 'Ormoc City',
  ormoc_far: 'Ormoc (far barangay)',
  leyte_province: 'Leyte (province)',
  visayas: 'Visayas (Cebu, Iloilo, etc.)',
  luzon: 'Luzon / Metro Manila',
  mindanao: 'Mindanao',
};

export const REGION_KEYS = Object.keys(regionShippingFees);

// Default fee (centavos) for an unknown/unmapped region.
export const DEFAULT_SHIPPING_FEE_CENTAVOS = 250000; // ₱2,500

export function getShippingFee(region: string, method: FulfillmentMethod): number {
  if (method === 'pickup') return 0;
  return regionShippingFees[region] ?? DEFAULT_SHIPPING_FEE_CENTAVOS;
}
