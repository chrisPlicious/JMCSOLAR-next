import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBooking, DbBookingType } from '@/lib/firebase/types';
import {
  Calendar, Clock, Phone, Mail, MapPin, Home, User,
  CreditCard, ExternalLink, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { RefundButton } from './RefundButton';
import {
  STATUS_TONES, BOOKING_TYPE_TONES, BOOKING_TYPE_LABELS,
  BOOKING_TYPE_ICONS, PAYMENT_STATUS_TONES, PAYMENT_STATUS_LABELS,
} from './booking-meta';

function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

function DetailRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {icon && <span className="text-slate-500 mt-0.5 shrink-0" aria-hidden>{icon}</span>}
      <span className="text-sm text-fg-subtle w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-fg break-words min-w-0">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-line shadow-soft p-5">
      <p className="caps mb-2">{title}</p>
      <div>{children}</div>
    </div>
  );
}

/** Presentational booking detail body — shared by the slide-in drawer and the deep-link page. */
export function BookingDetails({ booking: b }: { booking: DbBooking }) {
  const bookingType: DbBookingType = b.booking_type ?? 'consultation';
  const ref = `JMC-${b.id.slice(0, 8).toUpperCase()}`;
  const scheduledDate = b.preferred_date
    ? new Date(b.preferred_date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : '—';
  const paymongoUrl = b.payment_reference
    ? `https://dashboard.paymongo.com/payments/${b.payment_reference}`
    : null;

  return (
    <div className="space-y-4">
      {/* Identity + actions */}
      <div className="bg-white rounded-card border border-line shadow-soft p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-navy-50 rounded-control flex items-center justify-center shrink-0">
            <User size={18} className="text-navy-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-fg break-words">
              {b.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge tone={BOOKING_TYPE_TONES[bookingType]}>
                {BOOKING_TYPE_ICONS[bookingType]}
                {BOOKING_TYPE_LABELS[bookingType]}
              </Badge>
              <Badge tone={STATUS_TONES[b.status]}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </Badge>
              {b.payment_status && (
                <Badge tone={PAYMENT_STATUS_TONES[b.payment_status]}>
                  <CreditCard size={10} aria-hidden />
                  {PAYMENT_STATUS_LABELS[b.payment_status]}
                  {b.payment_status === 'paid' && b.payment_amount != null ? ` · ${formatCentavos(b.payment_amount)}` : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-fg-subtle mt-2">Ref: {ref} · Submitted {fmtDate(b.created_at)}</p>
          </div>
        </div>

        {(paymongoUrl || (b.payment_status === 'paid' && b.payment_amount != null)) && (
          <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-slate-100">
            {paymongoUrl && (
              <Button href={paymongoUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
                <ExternalLink size={14} aria-hidden />
                PayMongo
              </Button>
            )}
            {b.payment_status === 'paid' && b.payment_reference && b.payment_amount != null && (
              <RefundButton bookingId={b.id} paymentAmount={b.payment_amount} />
            )}
          </div>
        )}
      </div>

      <Section title="Schedule">
        <DetailRow label="Date" value={scheduledDate} icon={<Calendar size={14} />} />
        <DetailRow label="Time" value={b.preferred_time} icon={<Clock size={14} />} />
        {bookingType === 'consultation' && (
          <DetailRow label="Duration" value={b.duration_hours ? `${b.duration_hours} hour(s)` : null} />
        )}
      </Section>

      <Section title="Contact">
        <DetailRow label="Phone" value={b.phone} icon={<Phone size={14} />} />
        <DetailRow label="Email" value={b.email} icon={<Mail size={14} />} />
        <DetailRow label="City" value={b.city_name} icon={<MapPin size={14} />} />
        <DetailRow label="Address" value={b.address} icon={<Home size={14} />} />
      </Section>

      {bookingType === 'consultation' && (
        <Section title="Consultation Details">
          <DetailRow label="Service interest" value={b.service_type} />
          <DetailRow label="Property type" value={b.property_type} />
          <DetailRow label="Monthly bill" value={b.monthly_bill} />
          <DetailRow label="Notes" value={b.notes} />
        </Section>
      )}
      {bookingType === 'maintenance' && (
        <Section title="Maintenance Details">
          <DetailRow label="System size" value={b.system_size_kw ? `${b.system_size_kw} kW` : null} />
          <DetailRow label="Installed" value={b.installation_year} />
          <DetailRow label="Issue category" value={b.issue_category} />
          <DetailRow label="Issue description" value={b.issue_description} />
        </Section>
      )}
      {bookingType === 'site_assessment' && (
        <Section title="Site Assessment Details">
          <DetailRow label="Property type" value={b.property_type} />
          <DetailRow label="Roof type" value={b.roof_type} />
          <DetailRow label="Roof area" value={b.roof_area_sqm ? `${b.roof_area_sqm} sqm` : null} />
          <DetailRow label="Property age" value={b.property_age_years} />
          <DetailRow label="Monthly bill" value={b.monthly_bill} />
        </Section>
      )}

      <Section title="Payment">
        <DetailRow label="Status" value={b.payment_status ? PAYMENT_STATUS_LABELS[b.payment_status] : null} icon={<CreditCard size={14} />} />
        <DetailRow label="Amount" value={b.payment_amount != null ? formatCentavos(b.payment_amount) : null} />
        <DetailRow label="Payment ID" value={b.payment_reference} icon={<FileText size={14} />} />
        <DetailRow label="Session ID" value={b.payment_session_id} />
        {b.paid_at && <DetailRow label="Paid at" value={fmtDate(b.paid_at, true)} />}
        {b.refund_id && <DetailRow label="Refund ID" value={b.refund_id} />}
        {b.refund_amount != null && <DetailRow label="Refunded" value={formatCentavos(b.refund_amount)} />}
        {b.refunded_at && <DetailRow label="Refunded at" value={fmtDate(b.refunded_at, true)} />}
        {paymongoUrl && (
          <Button href={paymongoUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm" className="mt-3">
            <ExternalLink size={14} aria-hidden />
            Open in PayMongo dashboard
          </Button>
        )}
      </Section>
    </div>
  );
}
