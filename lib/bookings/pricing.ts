import type { BookingType } from '@/types';

// All amounts in centavos (PayMongo's unit). ₱500 = 50000.
export const CONSULTATION_HOURLY_CENTAVOS = 50000; // ₱500 / hour
export const CONSULTATION_DURATION_OPTIONS = [1, 2, 3] as const;
export type ConsultationDuration = (typeof CONSULTATION_DURATION_OPTIONS)[number];

export const MAINTENANCE_PER_KW_CENTAVOS = 100000; // ₱1,000 / kW
export const MAINTENANCE_KW_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;
export type MaintenanceSystemSize = (typeof MAINTENANCE_KW_OPTIONS)[number];

/**
 * Total price for a booking, in centavos.
 * Returns null for site_assessment (free intake) or when required opts are missing.
 */
export function getBookingAmount(
  bookingType: BookingType,
  opts?: { durationHours?: number; systemSizeKw?: number },
): number | null {
  if (bookingType === 'consultation') {
    const hours = clampDuration(opts?.durationHours);
    return CONSULTATION_HOURLY_CENTAVOS * hours;
  }
  if (bookingType === 'maintenance') {
    const kw = opts?.systemSizeKw;
    if (!kw || !(MAINTENANCE_KW_OPTIONS as readonly number[]).includes(kw)) return null;
    return MAINTENANCE_PER_KW_CENTAVOS * kw;
  }
  return null;
}

export function bookingRequiresPayment(
  bookingType: BookingType,
  opts?: { durationHours?: number },
): boolean {
  return getBookingAmount(bookingType, opts) !== null;
}

export function clampDuration(durationHours?: number): ConsultationDuration {
  const n = Number(durationHours);
  if (n === 2 || n === 3) return n;
  return 1;
}

export function formatCentavos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH')}`;
}
