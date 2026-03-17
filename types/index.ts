export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

export interface Project {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'school';
  systemSize: string;
  description: string;
  image?: string;
  location?: string;
  url?: string;
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

export type ProjectCategory = 'all' | 'residential' | 'commercial' | 'industrial' | 'agricultural';

export interface ClientType {
  id: string;
  icon: string;
  title: string;
  description: string;
  image: string;
  badge: 'residential' | 'commercial' | 'agricultural' | 'industrial';
}
