import { Wrench, MapPinned, Lightbulb } from 'lucide-react';
import type { DbBookingStatus, DbBookingType, DbBookingPaymentStatus } from '@/lib/firebase/types';
import type { BadgeTone } from '@/components/ui/Badge';

/** Badge tones (components/ui/Badge) — shared by BookingsList, BookingDetails and BookingDrawer. */
export type BookingBadgeTone = BadgeTone;

export const STATUS_TONES: Record<DbBookingStatus, BookingBadgeTone> = {
  pending: 'solar',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'info',
};

export const BOOKING_TYPE_TONES: Record<DbBookingType, BookingBadgeTone> = {
  consultation: 'solar',
  maintenance: 'info',
  site_assessment: 'success',
};

export const BOOKING_TYPE_LABELS: Record<DbBookingType, string> = {
  consultation: 'Consultation',
  maintenance: 'Maintenance',
  site_assessment: 'Site Assessment',
};

export const BOOKING_TYPE_ICONS: Record<DbBookingType, React.ReactNode> = {
  consultation: <Lightbulb size={12} aria-hidden />,
  maintenance: <Wrench size={12} aria-hidden />,
  site_assessment: <MapPinned size={12} aria-hidden />,
};

export const PAYMENT_STATUS_TONES: Record<DbBookingPaymentStatus, BookingBadgeTone> = {
  not_required: 'neutral',
  pending: 'solar',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

export const PAYMENT_STATUS_LABELS: Record<DbBookingPaymentStatus, string> = {
  not_required: 'Free',
  pending: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};
