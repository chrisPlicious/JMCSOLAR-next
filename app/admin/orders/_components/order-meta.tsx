import type {
  DbOrderStatus,
  DbOrderPaymentStatus,
  DbOrderSource,
  DbReturnStatus,
  DbFulfillmentMethod,
} from '@/lib/firebase/types';

export const ORDER_STATUS_STYLES: Record<DbOrderStatus, string> = {
  pending: 'bg-solar-400/15 text-solar-700 border-solar-400/30',
  paid: 'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-navy-50 text-navy-700 border-navy-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
};

export const ORDER_STATUS_LABELS: Record<DbOrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

/** Ordered list of statuses for the admin transition control. */
export const ORDER_STATUSES: DbOrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
];

export const PAYMENT_STATUS_STYLES: Record<DbOrderPaymentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const PAYMENT_STATUS_LABELS: Record<DbOrderPaymentStatus, string> = {
  pending: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const SOURCE_STYLES: Record<DbOrderSource, string> = {
  online: 'bg-slate-100 text-slate-600 border-slate-200',
  manual: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const SOURCE_LABELS: Record<DbOrderSource, string> = {
  online: 'Online',
  manual: 'Manual',
};

export const RETURN_STATUS_STYLES: Record<DbReturnStatus, string> = {
  none: 'bg-slate-100 text-slate-500 border-slate-200',
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

export const RETURN_STATUS_LABELS: Record<DbReturnStatus, string> = {
  none: 'None',
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

export const FULFILLMENT_LABELS: Record<DbFulfillmentMethod, string> = {
  delivery: 'Delivery',
  pickup: 'Store pickup',
};
