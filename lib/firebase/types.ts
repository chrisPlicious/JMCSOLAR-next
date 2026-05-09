export type DbProject = {
  id: string;
  title: string;
  category: string;
  system_size: string | null;
  description: string | null;
  location: string | null;
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
