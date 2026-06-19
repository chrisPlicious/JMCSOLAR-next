import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBooking, DbBookingType } from '@/lib/firebase/types';
import {
  Calendar, Clock, Phone, Mail, MapPin, Home, User,
  CreditCard, ExternalLink, FileText,
} from 'lucide-react';
import { RefundButton } from './RefundButton';
import {
  STATUS_STYLES, BOOKING_TYPE_STYLES, BOOKING_TYPE_LABELS,
  BOOKING_TYPE_ICONS, PAYMENT_STATUS_STYLES, PAYMENT_STATUS_LABELS,
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

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      {icon && <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>}
      <span className="text-sm text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-navy-900 break-words min-w-0">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
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
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
            <User size={18} className="text-navy-700" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-navy-900 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {b.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BOOKING_TYPE_STYLES[bookingType]}`}>
                {BOOKING_TYPE_ICONS[bookingType]}
                {BOOKING_TYPE_LABELS[bookingType]}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
              {b.payment_status && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PAYMENT_STATUS_STYLES[b.payment_status]}`}>
                  <CreditCard size={10} />
                  {PAYMENT_STATUS_LABELS[b.payment_status]}
                  {b.payment_status === 'paid' && b.payment_amount != null ? ` · ${formatCentavos(b.payment_amount)}` : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">Ref: {ref} · Submitted {fmtDate(b.created_at)}</p>
          </div>
        </div>

        {(paymongoUrl || (b.payment_status === 'paid' && b.payment_amount != null)) && (
          <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-slate-50">
            {paymongoUrl && (
              <a
                href={paymongoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ExternalLink size={14} />
                PayMongo
              </a>
            )}
            {b.payment_status === 'paid' && b.payment_reference && b.payment_amount != null && (
              <RefundButton bookingId={b.id} paymentAmount={b.payment_amount} />
            )}
          </div>
        )}
      </div>

      <Section title="Schedule">
        <Field label="Date" value={scheduledDate} icon={<Calendar size={14} />} />
        <Field label="Time" value={b.preferred_time} icon={<Clock size={14} />} />
        {bookingType === 'consultation' && (
          <Field label="Duration" value={b.duration_hours ? `${b.duration_hours} hour(s)` : null} />
        )}
      </Section>

      <Section title="Contact">
        <Field label="Phone" value={b.phone} icon={<Phone size={14} />} />
        <Field label="Email" value={b.email} icon={<Mail size={14} />} />
        <Field label="City" value={b.city_name} icon={<MapPin size={14} />} />
        <Field label="Address" value={b.address} icon={<Home size={14} />} />
      </Section>

      {bookingType === 'consultation' && (
        <Section title="Consultation Details">
          <Field label="Service interest" value={b.service_type} />
          <Field label="Property type" value={b.property_type} />
          <Field label="Monthly bill" value={b.monthly_bill} />
          <Field label="Notes" value={b.notes} />
        </Section>
      )}
      {bookingType === 'maintenance' && (
        <Section title="Maintenance Details">
          <Field label="System size" value={b.system_size_kw ? `${b.system_size_kw} kW` : null} />
          <Field label="Installed" value={b.installation_year} />
          <Field label="Issue category" value={b.issue_category} />
          <Field label="Issue description" value={b.issue_description} />
        </Section>
      )}
      {bookingType === 'site_assessment' && (
        <Section title="Site Assessment Details">
          <Field label="Property type" value={b.property_type} />
          <Field label="Roof type" value={b.roof_type} />
          <Field label="Roof area" value={b.roof_area_sqm ? `${b.roof_area_sqm} sqm` : null} />
          <Field label="Property age" value={b.property_age_years} />
          <Field label="Monthly bill" value={b.monthly_bill} />
        </Section>
      )}

      <Section title="Payment">
        <Field label="Status" value={b.payment_status ? PAYMENT_STATUS_LABELS[b.payment_status] : null} icon={<CreditCard size={14} />} />
        <Field label="Amount" value={b.payment_amount != null ? formatCentavos(b.payment_amount) : null} />
        <Field label="Payment ID" value={b.payment_reference} icon={<FileText size={14} />} />
        <Field label="Session ID" value={b.payment_session_id} />
        {b.paid_at && <Field label="Paid at" value={fmtDate(b.paid_at, true)} />}
        {b.refund_id && <Field label="Refund ID" value={b.refund_id} />}
        {b.refund_amount != null && <Field label="Refunded" value={formatCentavos(b.refund_amount)} />}
        {b.refunded_at && <Field label="Refunded at" value={fmtDate(b.refunded_at, true)} />}
        {paymongoUrl && (
          <a
            href={paymongoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors mt-3"
          >
            <ExternalLink size={14} />
            Open in PayMongo dashboard
          </a>
        )}
      </Section>
    </div>
  );
}
