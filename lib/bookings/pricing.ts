import type { BookingType } from '@/types';

// All amounts in centavos (PayMongo's unit). ₱500 = 50000.
export const CONSULTATION_HOURLY_CENTAVOS = 50000; // ₱500 / hour
export const CONSULTATION_DURATION_OPTIONS = [1, 2, 3] as const;

export type ConsultationDuration = (typeof CONSULTATION_DURATION_OPTIONS)[number];

/**
 * Total price for a booking, in centavos.
 * Returns null when the booking type has no price yet (maintenance,
 * site_assessment) — those stay free intake until prices are set.
 */
export function getBookingAmount(
  bookingType: BookingType,
  opts?: { durationHours?: number },
): number | null {
  if (bookingType === 'consultation') {
    const hours = clampDuration(opts?.durationHours);
    return CONSULTATION_HOURLY_CENTAVOS * hours;
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
