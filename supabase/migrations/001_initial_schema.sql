create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  system_size text,
  description text,
  location text,
  facebook_url text,
  cover_image_path text,
  created_at timestamptz default now()
);

create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  storage_path text not null,
  caption text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text not null,
  specs text,
  description text,
  badge text,
  image_path text,
  related_service text,
  created_at timestamptz default now()
);
