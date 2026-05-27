'use server';

import { adminDb } from '@/lib/firebase/admin';

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

export type CreateBookingResult = { bookingId: string } | { error: string };

export async function createBookingAction(data: BookingInput): Promise<CreateBookingResult> {
  if (!data.name || !data.phone || !data.city || !data.preferred_date || !data.preferred_time) {
    return { error: 'Missing required fields.' };
  }

  try {
    const ref = adminDb.collection('bookings').doc();
    const now = new Date().toISOString();

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
      status: 'pending',
      payment_status: 'not_required',
      payment_reference: null,
      payment_amount: null,
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

    return { bookingId: ref.id };
  } catch (e) {
    console.error('[createBookingAction]', e);
    return { error: 'Failed to submit booking. Please try again.' };
  }
}
