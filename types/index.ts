export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

export interface ProjectImage {
  id: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
}

// Snake_case fields match the DB schema
export interface Project {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  system_size: string | null;
  description: string | null;
  location: string | null;
  city_slug?: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  created_at: string;
  completed_at: string | null;
  images?: ProjectImage[];
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: 'panels' | 'batteries' | 'inverters' | 'controllers' | 'converters';
  specs: string | null;
  description: string | null;
  badge: string | null;
  image_path: string | null;
  related_service: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  quote: string;
  source: 'Google' | 'Facebook';
  date?: string;
}

export interface Partner {
  name: string;
  logo?: string;
  url: string;
}

export type NavItem = {
  label: string;
  href: string;
};

export type ProjectCategory =
  | 'all'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural';

export type ProductCategory =
  | 'panels'
  | 'batteries'
  | 'inverters'
  | 'controllers'
  | 'converters';

export interface ClientType {
  id: string;
  icon: string;
  title: string;
  description: string;
  image: string;
  badge: 'residential' | 'commercial' | 'agricultural' | 'industrial';
}

export interface BillResult {
  id: string;
  before_image_path: string;
  after_image_path: string;
  description?: string | null;
  display_order: number;
  created_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingPaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed';
export type BookingType = 'consultation' | 'maintenance' | 'site_assessment';

export interface Booking {
  id: string;
  booking_type: BookingType;
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
  status: BookingStatus;
  // Payment (PayMongo)
  payment_status: BookingPaymentStatus;
  payment_amount: number | null; // total in centavos (₱500 = 50000)
  payment_reference: string | null; // PayMongo payment id once paid
  payment_session_id: string | null; // PayMongo checkout_session id
  paid_at: string | null;
  created_at: string;
  updated_at: string | null;
}
