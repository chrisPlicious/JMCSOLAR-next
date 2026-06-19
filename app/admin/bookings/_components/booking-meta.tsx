import { Wrench, MapPinned, Lightbulb } from 'lucide-react';
import type { DbBookingStatus, DbBookingType, DbBookingPaymentStatus } from '@/lib/firebase/types';

export const STATUS_STYLES: Record<DbBookingStatus, string> = {
  pending: 'bg-solar-400/15 text-solar-700 border-solar-400/30',
  confirmed: 'bg-green-eco-bg text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-navy-50 text-navy-700 border-navy-200',
};

export const BOOKING_TYPE_STYLES: Record<DbBookingType, string> = {
  consultation: 'bg-solar-400/10 text-solar-700 border-solar-400/20',
  maintenance: 'bg-blue-50 text-blue-700 border-blue-200',
  site_assessment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const BOOKING_TYPE_LABELS: Record<DbBookingType, string> = {
  consultation: 'Consultation',
  maintenance: 'Maintenance',
  site_assessment: 'Site Assessment',
};

export const BOOKING_TYPE_ICONS: Record<DbBookingType, React.ReactNode> = {
  consultation: <Lightbulb size={12} />,
  maintenance: <Wrench size={12} />,
  site_assessment: <MapPinned size={12} />,
};

export const PAYMENT_STATUS_STYLES: Record<DbBookingPaymentStatus, string> = {
  not_required: 'bg-slate-100 text-slate-500 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const PAYMENT_STATUS_LABELS: Record<DbBookingPaymentStatus, string> = {
  not_required: 'Free',
  pending: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};
