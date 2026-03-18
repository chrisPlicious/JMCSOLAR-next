-- Enable RLS on all tables (in case not already enabled)
alter table products enable row level security;
alter table projects enable row level security;
alter table project_images enable row level security;

-- Allow anyone (anon + authenticated) to read public data
create policy "Public read products"
  on products for select
  to anon, authenticated
  using (true);

create policy "Public read projects"
  on projects for select
  to anon, authenticated
  using (true);

create policy "Public read project_images"
  on project_images for select
  to anon, authenticated
  using (true);
