import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import type { DbBooking, DbBookingStatus, DbBookingType } from '@/lib/firebase/types';
import Link from 'next/link';
import { Calendar, Clock, Phone, User, Zap, Wrench, MapPinned, Lightbulb, CreditCard, ExternalLink } from 'lucide-react';
import type { DbBookingPaymentStatus } from '@/lib/firebase/types';
import { formatCentavos } from '@/lib/bookings/pricing';
import { RefundButton } from './_components/RefundButton';

export const metadata = { title: 'Bookings — Admin' };

const STATUS_STYLES: Record<DbBookingStatus, string> = {
  pending: 'bg-solar-400/15 text-solar-700 border-solar-400/30',
  confirmed: 'bg-green-eco-bg text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-navy-50 text-navy-700 border-navy-200',
};

const BOOKING_TYPE_STYLES: Record<DbBookingType, string> = {
  consultation: 'bg-solar-400/10 text-solar-700 border-solar-400/20',
  maintenance: 'bg-blue-50 text-blue-700 border-blue-200',
  site_assessment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const BOOKING_TYPE_LABELS: Record<DbBookingType, string> = {
  consultation: 'Consultation',
  maintenance: 'Maintenance',
  site_assessment: 'Site Assessment',
};

const PAYMENT_STATUS_STYLES: Record<DbBookingPaymentStatus, string> = {
  not_required: 'bg-slate-100 text-slate-500 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PAYMENT_STATUS_LABELS: Record<DbBookingPaymentStatus, string> = {
  not_required: 'Free',
  pending: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const BOOKING_TYPE_ICONS: Record<DbBookingType, React.ReactNode> = {
  consultation: <Lightbulb size={12} />,
  maintenance: <Wrench size={12} />,
  site_assessment: <MapPinned size={12} />,
};

async function getBookings(): Promise<DbBooking[]> {
  const snap = await adminDb
    .collection('bookings')
    .orderBy('created_at', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DbBooking));
}

export default async function AdminBookingsPage() {
  await requireAdminAuth();
  const bookings = await getBookings();

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-black text-navy-900"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Bookings
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-slate-400" />
          </div>
          <p className="text-navy-900 font-semibold mb-1">No bookings yet</p>
          <p className="text-slate-500 text-sm">Booking requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: DbBooking }) {
  const refNumber = `JMC-${b.id.slice(0, 8).toUpperCase()}`;
  const bookingType: DbBookingType = b.booking_type ?? 'consultation';
  const dateDisplay = b.preferred_date
    ? new Date(b.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '—';
  const createdDisplay = new Date(b.created_at).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const secondaryInfo = () => {
    if (bookingType === 'maintenance') {
      return (
        <>
          {b.issue_category && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Wrench size={12} className="shrink-0" />
              {b.issue_category}
            </span>
          )}
          {b.system_size_kw && (
            <span className="text-sm text-slate-500">{b.system_size_kw} kW</span>
          )}
        </>
      );
    }
    if (bookingType === 'site_assessment') {
      return (
        <>
          {b.roof_type && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPinned size={12} className="shrink-0" />
              {b.roof_type}
            </span>
          )}
          {b.property_age_years && (
            <span className="text-sm text-slate-500">{b.property_age_years}</span>
          )}
        </>
      );
    }
    return (
      <>
        {b.service_type && (
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <Zap size={12} className="shrink-0" />
            {b.service_type}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-colors">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
            <User size={16} className="text-navy-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-navy-900">{b.name}</p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BOOKING_TYPE_STYLES[bookingType]}`}
              >
                {BOOKING_TYPE_ICONS[bookingType]}
                {BOOKING_TYPE_LABELS[bookingType]}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}
              >
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
              {b.payment_status && b.payment_status !== 'not_required' && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[b.payment_status]}`}
                >
                  <CreditCard size={10} />
                  {PAYMENT_STATUS_LABELS[b.payment_status]}
                  {b.payment_status === 'paid' && b.payment_amount != null
                    ? ` · ${formatCentavos(b.payment_amount)}`
                    : ''}
                </span>
              )}
              {b.payment_reference && (
                <a
                  href={`https://dashboard.paymongo.com/payments/${b.payment_reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View payment in PayMongo dashboard"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-0.5 rounded-full transition-colors"
                >
                  <ExternalLink size={10} />
                  PayMongo
                </a>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Phone size={12} className="shrink-0" />
                {b.phone}
              </span>
              {secondaryInfo()}
              <span className="text-sm text-slate-500">{b.city_name}</span>
            </div>
          </div>
        </div>

        {/* Right: schedule + meta */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1.5 text-navy-900 font-semibold text-sm justify-end mb-1">
            <Calendar size={13} className="text-slate-400" />
            {dateDisplay}
            <Clock size={13} className="text-slate-400 ml-1" />
            {b.preferred_time}
          </div>
          <p className="text-xs text-slate-400">Ref: {refNumber}</p>
          <p className="text-xs text-slate-400">Submitted {createdDisplay}</p>
          {b.payment_status === 'paid' && b.payment_reference && b.payment_amount != null && (
            <div className="mt-2">
              <RefundButton
                bookingId={b.id}
                paymentAmount={b.payment_amount}
              />
            </div>
          )}
        </div>
      </div>

      {(b.notes || (bookingType === 'maintenance' && b.issue_description)) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 italic line-clamp-2">
            &ldquo;{bookingType === 'maintenance' ? b.issue_description : b.notes}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
