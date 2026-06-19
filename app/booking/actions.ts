'use server';

import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';
import { getPaymentProvider } from '@/lib/payments';
import { notifyReceived, notifyAdminNewBooking } from '@/lib/bookings/notifications';
import {
  getBookingAmount,
  getSiteAssessmentTier,
  clampDuration,
  formatCentavos,
} from '@/lib/bookings/pricing';

export type ConsultationFormData = {
  name: string;
  phone: string;
  email: string;
  city: string;
  city_name: string;
  address: string;
  service_type: string;
  property_type: string;
  monthly_bill: string;
  notes: string;
  preferred_date: string;
  preferred_time: string;
  duration_hours: string;
};

export type MaintenanceFormData = {
  name: string;
  phone: string;
  email: string;
  city: string;
  city_name: string;
  address: string;
  system_size_kw: string;
  installation_year: string;
  issue_category: string;
  issue_description: string;
  preferred_date: string;
  preferred_time: string;
};

export type SiteAssessmentFormData = {
  name: string;
  phone: string;
  email: string;
  city: string;
  city_name: string;
  address: string;
  location_tier: string;
  property_type: string;
  roof_type: string;
  property_age_years: string;
  roof_area_sqm: string;
  monthly_bill: string;
  preferred_date: string;
  preferred_time: string;
};

type BookingInput =
  | (ConsultationFormData & { booking_type: 'consultation' })
  | (MaintenanceFormData & { booking_type: 'maintenance' })
  | (SiteAssessmentFormData & { booking_type: 'site_assessment' });

export type CreateBookingResult =
  | { bookingId: string; checkoutUrl?: string }
  | { error: string };

async function originUrl(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

export async function createBookingAction(data: BookingInput): Promise<CreateBookingResult> {
  if (!data.name || !data.phone || !data.city || !data.preferred_date || !data.preferred_time) {
    return { error: 'Missing required fields.' };
  }

  try {
    const ref = adminDb.collection('bookings').doc();
    const now = new Date().toISOString();

    const isConsultation = data.booking_type === 'consultation';
    const isMaintenance = data.booking_type === 'maintenance';
    const isSiteAssessment = data.booking_type === 'site_assessment';
    const durationHours = isConsultation
      ? clampDuration(Number((data as ConsultationFormData).duration_hours))
      : null;
    const systemSizeKw = isMaintenance
      ? Number((data as MaintenanceFormData).system_size_kw) || undefined
      : undefined;
    const siteAssessmentData = isSiteAssessment ? (data as SiteAssessmentFormData) : undefined;
    const amount = getBookingAmount(data.booking_type, {
      durationHours: durationHours ?? undefined,
      systemSizeKw,
      citySlug: siteAssessmentData?.city,
      locationTier: siteAssessmentData?.location_tier,
    });
    const requiresPayment = amount !== null;

    const base = {
      booking_type: data.booking_type,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim() || null,
      city: data.city,
      city_name: data.city_name,
      address: data.address.trim() || null,
      preferred_date: data.preferred_date,
      preferred_time: data.preferred_time,
      duration_hours: durationHours,
      status: 'pending',
      payment_status: requiresPayment ? 'pending' : 'not_required',
      payment_amount: amount,
      payment_reference: null,
      payment_session_id: null,
      paid_at: null,
      refund_id: null,
      refunded_at: null,
      refund_amount: null,
      created_at: now,
      updated_at: null,
    };

    let typeFields: Record<string, unknown>;

    if (data.booking_type === 'consultation') {
      typeFields = {
        service_type: data.service_type,
        property_type: data.property_type,
        monthly_bill: data.monthly_bill || null,
        notes: data.notes.trim() || null,
        system_size_kw: null,
        installation_year: null,
        issue_category: null,
        issue_description: null,
        roof_type: null,
        property_age_years: null,
        roof_area_sqm: null,
      };
    } else if (data.booking_type === 'maintenance') {
      typeFields = {
        service_type: null,
        property_type: null,
        monthly_bill: null,
        notes: null,
        system_size_kw: data.system_size_kw.trim() || null,
        installation_year: data.installation_year || null,
        issue_category: data.issue_category || null,
        issue_description: data.issue_description.trim() || null,
        roof_type: null,
        property_age_years: null,
        roof_area_sqm: null,
      };
    } else {
      typeFields = {
        service_type: null,
        property_type: data.property_type,
        monthly_bill: data.monthly_bill || null,
        notes: null,
        system_size_kw: null,
        installation_year: null,
        issue_category: null,
        issue_description: null,
        roof_type: data.roof_type || null,
        property_age_years: data.property_age_years || null,
        roof_area_sqm: data.roof_area_sqm.trim() || null,
      };
    }

    await ref.set({ ...base, ...typeFields });

    // Free intake types (maintenance, site assessment until priced) end here.
    if (!requiresPayment || amount === null) {
      // best-effort: ack the customer + alert the internal inbox (Zoho, CC ops Gmail)
      await Promise.all([notifyReceived(ref.id), notifyAdminNewBooking(ref.id)]);
      return { bookingId: ref.id };
    }

    // Pay-first: create a checkout session, persist its id, send customer to pay.
    const origin = await originUrl();
    const provider = getPaymentProvider();

    let description: string;
    let lineItems: { name: string; amount: number; quantity: number }[];
    let cancelUrl: string;

    if (isConsultation) {
      description = `Solar consultation — ${durationHours}hr (${formatCentavos(amount)})`;
      lineItems = [{ name: `Solar Consultation (${durationHours}hr)`, amount, quantity: 1 }];
      cancelUrl = `${origin}/booking/consultation`;
    } else if (isMaintenance) {
      description = `Solar system maintenance — ${systemSizeKw}kW (${formatCentavos(amount)})`;
      lineItems = [{ name: `Solar Maintenance (${systemSizeKw}kW)`, amount, quantity: 1 }];
      cancelUrl = `${origin}/booking/maintenance`;
    } else {
      // site assessment
      const tier = getSiteAssessmentTier(siteAssessmentData!.city, siteAssessmentData!.location_tier);
      const tierLabel = tier === 'ormoc_far' ? 'Ormoc far barangay' : tier === 'ormoc_city' ? 'Ormoc City' : 'Outside Ormoc';
      description = `Site assessment — ${tierLabel} (${formatCentavos(amount)})`;
      lineItems = [{ name: `Site Assessment (${tierLabel})`, amount, quantity: 1 }];
      cancelUrl = `${origin}/booking/site-assessment`;
    }

    // Overlap the "complete your payment" email with the checkout-session call so
    // it doesn't add latency before the redirect. notifyReceived never throws.
    const [session] = await Promise.all([
      provider.createCheckoutSession({
        bookingId: ref.id,
        amount,
        description,
        lineItems,
        customer: {
          name: data.name.trim(),
          email: data.email.trim() || null,
          phone: data.phone.trim(),
        },
        successUrl: `${origin}/booking/confirmation?id=${ref.id}&name=${encodeURIComponent(data.name.trim())}`,
        cancelUrl,
      }),
      notifyReceived(ref.id),
      notifyAdminNewBooking(ref.id),
    ]);

    await ref.update({
      payment_session_id: session.sessionId,
      updated_at: new Date().toISOString(),
    });

    return { bookingId: ref.id, checkoutUrl: session.checkoutUrl };
  } catch (e) {
    console.error('[createBookingAction]', e);
    return { error: 'Failed to submit booking. Please try again.' };
  }
}

/**
 * Stub-only: simulates a successful payment for local/dev testing.
 * Guarded so it can never flip a booking paid when a real provider is active.
 */
export async function simulatePaymentAction(
  bookingId: string,
): Promise<{ success: true } | { error: string }> {
  const provider = (process.env.PAYMENT_PROVIDER ?? 'stub').toLowerCase();
  if (provider !== 'stub') {
    return { error: 'Simulated payment is disabled when a real provider is active.' };
  }
  if (!bookingId) return { error: 'Missing booking id.' };

  try {
    const ref = adminDb.collection('bookings').doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists) return { error: 'Booking not found.' };

    await ref.update({
      payment_status: 'paid',
      payment_reference: `stub_${crypto.randomUUID()}`,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    console.error('[simulatePaymentAction]', e);
    return { error: 'Failed to confirm payment.' };
  }
}
