import { adminDb } from '@/lib/firebase/admin';
import { sendMail, smtpUser, adminCc } from '@/lib/email-transporter';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBooking } from '@/lib/firebase/types';

// Optional absolute base for links in emails (relative hrefs don't resolve in mail clients).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

// Operations inboxes copied on every internal (admin) notification. The primary
// recipient is the Zoho address (smtpUser()); adminCc() addresses are CC'd alongside.
const ADMIN_CC = adminCc();

function bookingPath(bookingType: DbBooking['booking_type']): string {
  if (bookingType === 'maintenance') return '/booking/maintenance';
  if (bookingType === 'site_assessment') return '/booking/site-assessment';
  return '/booking/consultation';
}

function serviceLabelFor(b: DbBooking): string {
  if (b.booking_type === 'maintenance') return 'maintenance service';
  if (b.booking_type === 'site_assessment') return 'site assessment';
  return 'consultation';
}

function emailWrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0a1628;padding:28px 36px;border-radius:8px 8px 0 0;">
            <p style="margin:0;color:#f5a623;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">JMC Solar PH</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 8px 8px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;color:#999;font-size:12px;">JMC Solar PH · Cogon, Ormoc City, Leyte</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#888;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#0a1628;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}

function ctaButton(label: string, href: string): string {
  return `<div style="margin:28px 0 0;">
    <a href="${href}" style="display:inline-block;padding:12px 24px;background:#0a1628;color:#f5a623;font-size:13px;font-weight:700;text-decoration:none;border-radius:4px;letter-spacing:1px;text-transform:uppercase;">${label}</a>
  </div>`;
}

/**
 * Booking submitted → acknowledge receipt to the customer. Wording adapts to
 * whether payment is still owed (pending) or the booking is free (not_required).
 * Never throws.
 */
export async function notifyReceived(bookingId: string): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    if (!b.email) return;

    const serviceLabel = serviceLabelFor(b);
    const serviceTitle = serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1);
    const when = `${b.preferred_date} ${b.preferred_time}`;
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;
    const awaitingPayment = b.payment_status === 'pending';
    const amount = b.payment_amount != null ? formatCentavos(b.payment_amount) : null;

    const headline = awaitingPayment ? 'Almost there — complete your payment' : 'Booking received';
    const lead = awaitingPayment
      ? `Hi ${b.name}, we've received your ${serviceLabel} request. To lock in your slot, complete the payment${amount ? ` of <strong>${amount}</strong>` : ''}. Your booking isn't confirmed until payment is received.`
      : `Hi ${b.name}, we've received your ${serviceLabel} request. We'll reach out to confirm the details.`;
    const note = awaitingPayment
      ? "If you closed the payment window before finishing, just submit the booking again — you're only charged once payment completes."
      : "We'll contact you shortly using the details you provided.";

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">${headline}</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">${lead}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Service', serviceTitle)}
        ${row('Requested', when)}
        ${amount ? row('Amount', amount) : ''}
        ${row('Reference', ref)}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">${note}</p>
      </div>
    `);

    await sendMail({
      to: b.email,
      subject: awaitingPayment
        ? `Complete your payment — JMC Solar ${serviceLabel} (${ref})`
        : `Booking received — JMC Solar ${serviceLabel} (${ref})`,
      text: [
        `Hi ${b.name},`,
        ``,
        awaitingPayment
          ? `We've received your ${serviceLabel} request. Complete the payment${amount ? ` of ${amount}` : ''} to confirm your slot — it isn't confirmed until payment is received.`
          : `We've received your ${serviceLabel} request. We'll reach out to confirm the details.`,
        `Requested time: ${when}`,
        `Reference: ${ref}`,
        ``,
        note,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[notifications] notifyReceived failed', e);
  }
}

/** Payment succeeded → confirm to customer + alert admin. Never throws. */
export async function notifyPaid(bookingId: string): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    const admin = smtpUser();
    const amount = b.payment_amount != null ? formatCentavos(b.payment_amount) : '—';
    const when = `${b.preferred_date} ${b.preferred_time}`;
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;

    const isMaintenance = b.booking_type === 'maintenance';
    const isSiteAssessment = b.booking_type === 'site_assessment';
    const serviceLabel = serviceLabelFor(b);
    const scheduleDetail = isMaintenance
      ? (b.system_size_kw ? ` · ${b.system_size_kw}kW system` : '')
      : (b.duration_hours ? ` (${b.duration_hours}hr)` : '');
    const followUp = isMaintenance
      ? 'Our technician will contact you before the scheduled visit.'
      : isSiteAssessment
      ? 'Our engineer will contact you to confirm your site visit.'
      : "We'll send your video call link before the scheduled time.";

    if (b.email) {
      const customerHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Booking Confirmed</p>
        <p style="margin:0 0 28px;font-size:14px;color:#666;">Hi ${b.name}, your payment of <strong>${amount}</strong> has been received.</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetail)}
          ${row('Date & Time', when)}
          ${row('Reference', ref)}
        </table>
        <div style="margin:28px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
          <p style="margin:0;font-size:13px;color:#555;">${followUp}</p>
        </div>
      `);

      await sendMail({
        to: b.email,
        subject: `Your JMC Solar ${serviceLabel} is confirmed — ${ref}`,
        text: [
          `Hi ${b.name},`,
          ``,
          `We've received your payment of ${amount} — your ${serviceLabel} slot is reserved.`,
          `Requested time: ${when}${scheduleDetail}`,
          `Reference: ${ref}`,
          ``,
          followUp,
          ``,
          `— JMC Solar PH`,
        ].join('\n'),
        html: customerHtml,
      });
    }

    if (admin) {
      const adminHtml = emailWrap(`
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">Payment Received</p>
        <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0a1628;">${b.name}</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
          ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetail)}
          ${row('Phone', b.phone)}
          ${row('Email', b.email ?? 'n/a')}
          ${row('City', b.city_name)}
          ${row('Requested', when)}
          ${row('Amount', `<span style="font-size:18px;color:#0a1628;">${amount}</span>`)}
        </table>
        ${SITE_URL ? ctaButton('View Booking', `${SITE_URL}/admin/bookings/${bookingId}`) : ''}
      `);

      await sendMail({
        to: admin,
        cc: ADMIN_CC,
        subject: `PAID ${serviceLabel} — ${b.name} (${amount})`,
        text: [
          `A ${serviceLabel} booking was paid.`,
          ``,
          `Name: ${b.name}`,
          `Phone: ${b.phone}`,
          `Email: ${b.email ?? 'n/a'}`,
          `City: ${b.city_name}`,
          `Requested: ${when}${scheduleDetail}`,
          `Amount: ${amount}`,
          `Booking: /admin/bookings/${bookingId}`,
        ].join('\n'),
        html: adminHtml,
      });
    }
  } catch (e) {
    console.error('[notifications] notifyPaid failed', e);
  }
}

/** Payment attempt failed (no money charged) → let the customer know they can retry. Never throws. */
export async function notifyFailed(bookingId: string): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    if (!b.email) return; // nothing to send to

    const serviceLabel = serviceLabelFor(b);
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;
    const retryHref = SITE_URL ? `${SITE_URL}${bookingPath(b.booking_type)}` : null;

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Payment didn't go through</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${b.name}, your payment for the ${serviceLabel} wasn't completed, so <strong>you were not charged</strong> and the booking isn't confirmed yet.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1))}
        ${row('Reference', ref)}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#fdf6f6;border-left:3px solid #d9534f;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">No worries — no money left your account. You can try booking again anytime.</p>
      </div>
      ${retryHref ? ctaButton('Try Again', retryHref) : ''}
    `);

    await sendMail({
      to: b.email,
      subject: `Payment not completed — your JMC Solar ${serviceLabel} (${ref})`,
      text: [
        `Hi ${b.name},`,
        ``,
        `Your payment for the ${serviceLabel} wasn't completed, so you were NOT charged and the booking isn't confirmed.`,
        `Reference: ${ref}`,
        ``,
        `No money left your account. You can try booking again anytime${retryHref ? `: ${retryHref}` : '.'}`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[notifications] notifyFailed failed', e);
  }
}

/** Payment refunded → confirm the return to the customer. Never throws. */
export async function notifyRefunded(bookingId: string, refundCentavos?: number): Promise<void> {
  try {
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;
    if (!b.email) return;

    const serviceLabel = serviceLabelFor(b);
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;
    const amountCentavos = refundCentavos ?? b.refund_amount ?? b.payment_amount ?? null;
    const amount = amountCentavos != null ? formatCentavos(amountCentavos) : 'your payment';

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">Refund Processed</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${b.name}, we've refunded <strong>${amount}</strong> for your ${serviceLabel}. The booking has been cancelled.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Service', serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1))}
        ${row('Refunded', amount)}
        ${row('Reference', ref)}
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#f9f7f2;border-left:3px solid #f5a623;border-radius:2px;">
        <p style="margin:0;font-size:13px;color:#555;">The amount returns to your original payment method, typically within 5–10 banking days depending on your bank or e-wallet.</p>
      </div>
    `);

    await sendMail({
      to: b.email,
      subject: `Refund processed — your JMC Solar ${serviceLabel} (${ref})`,
      text: [
        `Hi ${b.name},`,
        ``,
        `We've refunded ${amount} for your ${serviceLabel}. The booking has been cancelled.`,
        `Reference: ${ref}`,
        ``,
        `The amount returns to your original payment method, typically within 5–10 banking days.`,
        ``,
        `— JMC Solar PH`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[notifications] notifyRefunded failed', e);
  }
}

/** Per-type extra line for internal emails (system size, duration, etc.). */
function scheduleDetailFor(b: DbBooking): string {
  if (b.booking_type === 'maintenance') return b.system_size_kw ? ` · ${b.system_size_kw}kW system` : '';
  if (b.booking_type === 'site_assessment') return b.roof_type ? ` · ${b.roof_type}` : '';
  return b.duration_hours ? ` (${b.duration_hours}hr)` : '';
}

/**
 * New booking created → notify the internal inbox (Zoho) and CC the ops Gmail.
 * Fires for both free and pay-first bookings. Never throws.
 */
export async function notifyAdminNewBooking(bookingId: string): Promise<void> {
  try {
    const admin = smtpUser();
    if (!admin) return;

    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return;
    const b = snap.data() as DbBooking;

    const serviceLabel = serviceLabelFor(b);
    const serviceTitle = serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetailFor(b);
    const when = `${b.preferred_date} ${b.preferred_time}`;
    const ref = `JMC-${bookingId.slice(0, 8).toUpperCase()}`;
    const paymentLine =
      b.payment_status === 'pending'
        ? `Awaiting payment${b.payment_amount != null ? ` (${formatCentavos(b.payment_amount)})` : ''}`
        : b.payment_status === 'not_required'
        ? 'Free booking'
        : b.payment_status;

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">New Booking</p>
      <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0a1628;">${b.name}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Service', serviceTitle)}
        ${row('Phone', b.phone)}
        ${row('Email', b.email ?? 'n/a')}
        ${row('City', b.city_name)}
        ${row('Requested', when)}
        ${row('Payment', paymentLine)}
        ${row('Reference', ref)}
      </table>
      ${SITE_URL ? ctaButton('View Bookings', `${SITE_URL}/admin/bookings`) : ''}
    `);

    await sendMail({
      to: admin,
      cc: ADMIN_CC,
      subject: `NEW ${serviceLabel} — ${b.name} (${ref})`,
      text: [
        `A new ${serviceLabel} booking was submitted.`,
        ``,
        `Name: ${b.name}`,
        `Phone: ${b.phone}`,
        `Email: ${b.email ?? 'n/a'}`,
        `City: ${b.city_name}`,
        `Requested: ${when}`,
        `Payment: ${paymentLine}`,
        `Reference: ${ref}`,
        ``,
        `Bookings: ${SITE_URL ? `${SITE_URL}/admin/bookings` : '/admin/bookings'}`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[notifications] notifyAdminNewBooking failed', e);
  }
}

/**
 * Upcoming-service reminder for the internal team. Sent T-2 and T-1 days before
 * the scheduled date. Goes to the Zoho inbox, CC the ops Gmail. Never throws.
 * Returns whether the mail was actually sent (so the cron can mark it done).
 */
export async function sendBookingReminder(b: DbBooking, daysOut: number): Promise<boolean> {
  try {
    const admin = smtpUser();
    if (!admin) return false;

    const serviceLabel = serviceLabelFor(b);
    const serviceTitle = serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1) + scheduleDetailFor(b);
    const when = `${b.preferred_date} ${b.preferred_time}`;
    const ref = `JMC-${b.id.slice(0, 8).toUpperCase()}`;
    const lead =
      daysOut === 1
        ? `Reminder: a ${serviceLabel} is scheduled tomorrow.`
        : `Reminder: a ${serviceLabel} is scheduled in ${daysOut} days.`;

    const html = emailWrap(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f5a623;">Upcoming Service · ${daysOut === 1 ? 'Tomorrow' : `In ${daysOut} days`}</p>
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a1628;">${b.name}</p>
      <p style="margin:0 0 24px;font-size:14px;color:#666;">${lead}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #eee;">
        ${row('Service', serviceTitle)}
        ${row('Date & Time', when)}
        ${row('Phone', b.phone)}
        ${row('Email', b.email ?? 'n/a')}
        ${row('City', b.city_name)}
        ${row('Status', b.status)}
        ${row('Reference', ref)}
      </table>
      ${SITE_URL ? ctaButton('View Bookings', `${SITE_URL}/admin/bookings`) : ''}
    `);

    return await sendMail({
      to: admin,
      cc: ADMIN_CC,
      subject: `REMINDER — ${serviceLabel} for ${b.name} ${daysOut === 1 ? 'tomorrow' : `in ${daysOut} days`} (${when})`,
      text: [
        lead,
        ``,
        `Name: ${b.name}`,
        `Service: ${serviceTitle}`,
        `Date & Time: ${when}`,
        `Phone: ${b.phone}`,
        `Email: ${b.email ?? 'n/a'}`,
        `City: ${b.city_name}`,
        `Status: ${b.status}`,
        `Reference: ${ref}`,
      ].join('\n'),
      html,
    });
  } catch (e) {
    console.error('[notifications] sendBookingReminder failed', e);
    return false;
  }
}
