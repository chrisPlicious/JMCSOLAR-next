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
  // SEO slug for the /products/[slug] detail page. Optional until existing docs are
  // backfilled (scripts/backfill-product-slugs.mjs); new products get one on create.
  slug?: string;
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

// ---------------------------------------------------------------------------
// E-commerce store (shopItems / orders) — see .claude/plans/ecommerce-store.md
// Money is always centavos (integers); ₱500 = 50000. Never store floats/pesos.
// ---------------------------------------------------------------------------

export type ShopItemCategory = 'lights' | 'wires' | 'accessories';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentMethod = 'delivery' | 'pickup';
export type OrderSource = 'online' | 'manual'; // #19 — 'manual' = admin-created phone/walk-in order
export type ReturnStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'completed'; // #23 RMA
export type StockChangeReason =
  | 'sale'
  | 'refund_restore'
  | 'cancel_restore'
  | 'manual_adjust'
  | 'po_receive'
  | 'csv_import';
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';

// #9 product variants — empty/absent = simple item (use base price + stock)
export interface ShopItemVariant {
  id: string; // stable variant id
  label: string; // e.g. "100W", "Warm White", "5m"
  sku: string;
  price_centavos: number; // overrides base price for this variant
  stock: number;
}

export interface ShopItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ShopItemCategory;
  sku: string;
  price: number; // centavos — base price; per-variant price overrides when variants exist
  stock: number; // base stock; used when item has NO variants
  low_stock_threshold: number | null; // #14 — badge/alert when stock <= this (null = use default)
  active: boolean;
  weight_grams: number | null;
  image_path: string | null;
  variants: ShopItemVariant[] | null; // #9
  meta_title: string | null; // #5 SEO override (falls back to name)
  meta_description: string | null; // #5 SEO override (falls back to description)
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  shop_item_id: string;
  variant_id: string | null; // #9 — null for simple items
  name: string;
  sku: string;
  unit_price_centavos: number;
  quantity: number;
  line_total_centavos: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal_centavos: number;
  shipping_centavos: number;
  shipping_region: string;
  fulfillment_method: FulfillmentMethod;
  source: OrderSource; // #19
  return_status: ReturnStatus; // #23
  total_centavos: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string | null;
  };
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_reference: string | null;
  payment_session_id: string | null;
  paid_at: string | null;
  refund_id: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string | null; // set on create; null until first update
}

// #15 stock history / audit log
export interface StockAuditEntry {
  id: string;
  shop_item_id: string;
  variant_id: string | null;
  delta: number; // signed: -2 (sale), +5 (PO receive), +1 (refund restore)
  reason: StockChangeReason;
  ref_id: string | null; // order id / PO id / import batch id
  actor: string; // 'system' | 'webhook' | admin email
  stock_after: number;
  created_at: string;
}

// #16 purchase orders / supplier transfers
export interface PurchaseOrderLine {
  shop_item_id: string;
  variant_id: string | null;
  qty_ordered: number;
  qty_received: number;
  unit_cost_centavos: number | null;
}

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  reference: string | null;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  notes: string | null;
  created_by: string; // admin email
  created_at: string;
  received_at: string | null;
}

// #23 self-serve returns (guest: order-ID + email lookup)
export interface RmaRequest {
  id: string;
  order_id: string;
  customer_email: string; // must match order.customer.email to authorize lookup
  items: { shop_item_id: string; variant_id: string | null; quantity: number }[];
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

// #11 abandoned cart recovery
export interface AbandonedCart {
  id: string;
  email: string;
  items: { shop_item_id: string; variant_id: string | null; quantity: number }[];
  recovered: boolean; // set true if a paid order with this email follows
  reminder_sent_at: string | null;
  created_at: string;
}
