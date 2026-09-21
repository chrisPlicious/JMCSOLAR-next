'use client';

import { useState } from 'react';
import { Calendar, Clock, Phone, User, Zap, Wrench, MapPinned, CreditCard, ExternalLink } from 'lucide-react';
import type { DbBooking, DbBookingType } from '@/lib/firebase/types';
import { formatCentavos } from '@/lib/bookings/pricing';
import { RefundButton } from './RefundButton';
import { BookingDrawer } from './BookingDrawer';
import Badge from '@/components/ui/Badge';
import {
  STATUS_TONES, BOOKING_TYPE_TONES, BOOKING_TYPE_LABELS,
  BOOKING_TYPE_ICONS, PAYMENT_STATUS_TONES, PAYMENT_STATUS_LABELS,
} from './booking-meta';

export function BookingsList({ bookings }: { bookings: DbBooking[] }) {
  const [selected, setSelected] = useState<DbBooking | null>(null);
  const [open, setOpen] = useState(false);

  const openBooking = (b: DbBooking) => { setSelected(b); setOpen(true); };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-card border border-line shadow-soft p-12 text-center">
        <div className="w-14 h-14 bg-slate-50 rounded-card flex items-center justify-center mx-auto mb-4">
          <Calendar size={24} className="text-slate-500" aria-hidden />
        </div>
        <p className="text-fg font-semibold mb-1">No bookings yet</p>
        <p className="text-fg-muted text-sm">Booking requests will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onOpen={() => openBooking(b)} />
        ))}
      </div>
      <BookingDrawer open={open} booking={selected} onClose={() => setOpen(false)} />
    </>
  );
}

function BookingCard({ booking: b, onOpen }: { booking: DbBooking; onOpen: () => void }) {
  const refNumber = `JMC-${b.id.slice(0, 8).toUpperCase()}`;
  const bookingType: DbBookingType = b.booking_type ?? 'consultation';
  const dateDisplay = b.preferred_date
    ? new Date(b.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : '—';
  const createdDisplay = new Date(b.created_at).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const secondaryInfo = () => {
    if (bookingType === 'maintenance') {
      return (
        <>
          {b.issue_category && (
            <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
              <Wrench size={12} className="shrink-0" />
              {b.issue_category}
            </span>
          )}
          {b.system_size_kw && <span className="text-sm text-fg-subtle">{b.system_size_kw} kW</span>}
        </>
      );
    }
    if (bookingType === 'site_assessment') {
      return (
        <>
          {b.roof_type && (
            <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
              <MapPinned size={12} className="shrink-0" />
              {b.roof_type}
            </span>
          )}
          {b.property_age_years && <span className="text-sm text-fg-subtle">{b.property_age_years}</span>}
        </>
      );
    }
    return (
      <>
        {b.service_type && (
          <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
            <Zap size={12} className="shrink-0" />
            {b.service_type}
          </span>
        )}
      </>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="bg-white rounded-card border border-line shadow-soft p-5 hover:border-slate-300 hover:shadow-card transition-[border-color,box-shadow] cursor-pointer"
    >
      <div className="flex flex-wrap items-start gap-4 justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 bg-navy-50 rounded-control flex items-center justify-center shrink-0">
            <User size={16} className="text-navy-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-fg">{b.name}</p>
              <Badge tone={BOOKING_TYPE_TONES[bookingType]}>
                {BOOKING_TYPE_ICONS[bookingType]}
                {BOOKING_TYPE_LABELS[bookingType]}
              </Badge>
              <Badge tone={STATUS_TONES[b.status]}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </Badge>
              {b.payment_status && b.payment_status !== 'not_required' && (
                <Badge tone={PAYMENT_STATUS_TONES[b.payment_status]}>
                  <CreditCard size={10} aria-hidden />
                  {PAYMENT_STATUS_LABELS[b.payment_status]}
                  {b.payment_status === 'paid' && b.payment_amount != null ? ` · ${formatCentavos(b.payment_amount)}` : ''}
                </Badge>
              )}
              {b.payment_reference && (
                <a
                  href={`https://dashboard.paymongo.com/payments/${b.payment_reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  title="View payment in PayMongo dashboard"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted border border-line bg-white hover:bg-slate-50 px-2.5 py-0.5 rounded-full transition-colors"
                >
                  <ExternalLink size={10} aria-hidden />
                  PayMongo
                </a>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
                <Phone size={12} className="shrink-0" aria-hidden />
                {b.phone}
              </span>
              {secondaryInfo()}
              <span className="text-sm text-fg-subtle">{b.city_name}</span>
            </div>
          </div>
        </div>

        {/* Right: schedule + meta */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1.5 text-fg font-semibold text-sm justify-end mb-1">
            <Calendar size={13} className="text-slate-500" aria-hidden />
            {dateDisplay}
            <Clock size={13} className="text-slate-500 ml-1" aria-hidden />
            {b.preferred_time}
          </div>
          <p className="text-xs text-fg-subtle">Ref: {refNumber}</p>
          <p className="text-xs text-fg-subtle">Submitted {createdDisplay}</p>
          {b.payment_status === 'paid' && b.payment_reference && b.payment_amount != null && (
            <div className="mt-2" onClick={stop}>
              <RefundButton bookingId={b.id} paymentAmount={b.payment_amount} />
            </div>
          )}
        </div>
      </div>

      {(b.notes || (bookingType === 'maintenance' && b.issue_description)) && (
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-sm text-fg-subtle italic line-clamp-2">
            &ldquo;{bookingType === 'maintenance' ? b.issue_description : b.notes}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
