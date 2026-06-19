export type DbProject = {
  id: string;
  title: string;
  category: string;
  system_size: string | null;
  description: string | null;
  location: string | null;
  city_slug: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  created_at: string;
};

export type DbProjectImage = {
  id: string;
  project_id: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type DbProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  specs: string | null;
  description: string | null;
  badge: string | null;
  image_path: string | null;
  related_service: string | null;
  created_at: string;
};

export type DbService = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  description: string;
  highlight: boolean;
  display_order: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
};

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type DbReview = {
  id: string;
  reviewer_name: string;
  quote: string;
  source: string;
  rating: number;
  status?: ReviewStatus;
  city_slug?: string | null;
  company_name?: string;
  contact_type?: 'email' | 'phone';
  contact_value?: string;
  created_at: string;
  updated_at: string;
};

export type DbContactSubmission = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  system_type: string | null;
  message: string | null;
  created_at: string;
};

export type DbServiceDetail = {
  id: string;
  service_id: string;
  tagline: string;
  overview: string;
  what_is_it: string;
  how_it_works: { step: string; description: string }[];
  benefits: { iconName: string; title: string; description: string }[];
  use_cases: { item: string }[];
  specs: { label: string; value: string }[];
  sources: { title: string; url: string; publisher: string }[];
  created_at: string;
  updated_at: string;
};

export type WithId<T> = T & { id: string }

export type DbBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type DbBookingPaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed' | 'refunded';
export type DbBookingType = 'consultation' | 'maintenance' | 'site_assessment';

export type DbBooking = {
  id: string;
  booking_type: DbBookingType;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  city_name: string;
  address: string | null;
  // consultation
  service_type: string | null;
  property_type: 'residential' | 'commercial' | 'industrial' | 'agricultural' | null;
  monthly_bill: string | null;
  notes: string | null;
  // maintenance
  system_size_kw: string | null;
  installation_year: string | null;
  issue_category: string | null;
  issue_description: string | null;
  // site assessment
  roof_type: string | null;
  property_age_years: string | null;
  roof_area_sqm: string | null;
  // schedule
  preferred_date: string;
  preferred_time: string;
  duration_hours: number | null; // consultation only — drives price
  status: DbBookingStatus;
  // Payment (PayMongo)
  payment_status: DbBookingPaymentStatus;
  payment_amount: number | null; // total in centavos (₱500 = 50000)
  payment_reference: string | null; // PayMongo payment id once paid
  payment_session_id: string | null; // PayMongo checkout_session id
  paid_at: string | null;
  // Refund (PayMongo)
  refund_id: string | null; // PayMongo refund id (ref_xxx)
  refunded_at: string | null; // ISO timestamp when refunded
  refund_amount: number | null; // amount refunded in centavos
  // Internal reminder emails (set by the booking-reminders cron; absent = not yet sent)
  reminder_2d_sent?: boolean;
  reminder_1d_sent?: boolean;
  created_at: string;
  updated_at: string | null;
};
