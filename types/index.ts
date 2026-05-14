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
