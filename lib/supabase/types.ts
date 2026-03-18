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
