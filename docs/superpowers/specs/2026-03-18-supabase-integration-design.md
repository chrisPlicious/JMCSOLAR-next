# Supabase Integration Design

**Date:** 2026-03-18
**Project:** JMCSOLAR-next
**Status:** Approved

## Overview

Integrate Supabase into the existing Next.js site to replace static data files with a live database, enable admin-managed photo uploads for projects and products, and provide a simple password-protected admin panel for content management.

Videos are out of scope for uploads — the client embeds YouTube/Facebook videos via iframes.

---

## Goals

- Replace `data/projects.ts` and `data/products.ts` with Supabase PostgreSQL
- Enable admin to create, edit, and delete projects with multi-photo upload
- Enable admin to create, edit, and delete products with a single product image
- Protect all admin functionality behind a simple password-based auth (no Supabase Auth)
- Keep the public site read-only using the Supabase anon key

---

## Data Model

### `projects` table

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default gen_random_uuid() |
| title | text | e.g. "Private School - 100kWp" |
| category | text | residential / commercial / industrial / agricultural / school |
| system_size | text | e.g. "100 kWp" |
| description | text | |
| location | text | e.g. "Ormoc City, Leyte" |
| facebook_url | text | Link to Facebook post (replaces `url` field from static data) |
| cover_image_path | text | Storage path of the main/cover photo |
| created_at | timestamptz | Default now() |

**Note on `facebook_url`:** The existing `Project` TypeScript type uses `url?: string`. This will be renamed to `facebook_url` in both the database and the TypeScript type. `ProjectCard.tsx` will be updated to reference `facebook_url`.

**Note on category values:** The `ProjectCategory` filter type in `types/index.ts` is missing `'school'`. It will be updated to include `'school'` and a School filter tab will be added to the projects page UI.

### `project_images` table

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default gen_random_uuid() |
| project_id | uuid | FK → projects(id) ON DELETE CASCADE |
| storage_path | text | Path in Supabase Storage |
| caption | text | Optional label |
| display_order | int | For ordering photos in gallery |
| created_at | timestamptz | Default now() |

### `products` table

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default gen_random_uuid() |
| name | text | e.g. "Trina Solar 550W" |
| brand | text | |
| category | text | panels / batteries / inverters / controllers / converters |
| specs | text | |
| description | text | |
| badge | text | Optional — "Best Seller", "New", etc. |
| image_path | text | Storage path in Supabase Storage |
| related_service | text | Links to service type for inquiry pre-fill |
| created_at | timestamptz | Default now() |

**Note on category values:** The database uses the existing `ProductCategory` TypeScript values (`panels`, `batteries`, `inverters`, `controllers`, `converters`) to avoid type mismatches. No changes needed to the TypeScript type.

**No price field:** The `priceLabel` field from the static data is intentionally dropped. Products drive users to the inquiry form. Any UI that currently renders `priceLabel` will be removed.

---

## Supabase Storage

Two public buckets:

| Bucket | Usage | Structure |
|---|---|---|
| `project-images` | Project photos (multiple per project) | `{project_id}/{filename}` |
| `product-images` | Product photos (one per product) | `{product_id}/{filename}` |

Both buckets are public — images served via Supabase Storage public URLs, no signed URLs required.

**`next.config.ts` update required:** Add a `remotePatterns` entry for the Supabase Storage domain to support `next/image`:

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '<project-ref>.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

---

## Admin Panel

### Auth Flow

- `ADMIN_PASSWORD` and `SESSION_SECRET` stored in `.env.local` (never committed)
- `/admin/login` — password form submitted via Next.js Server Action
- Server action verifies password → generates a HMAC-SHA256 token (HMAC of a random nonce + `SESSION_SECRET`) → stores token in an `httpOnly`, `Secure`, `SameSite=Strict` cookie (`admin_session`)
- Next.js middleware reads the cookie and verifies the HMAC signature on every `/admin/**` request — redirects to `/admin/login` if absent or invalid

### Routes

```
/admin                      Dashboard with links to sections
/admin/login                Password login form

/admin/projects             List all projects (edit / delete)
/admin/projects/new         Create project + upload photos
/admin/projects/[id]        Edit project details + manage photo gallery

/admin/products             List all products (edit / delete)
/admin/products/new         Create product + upload image
/admin/products/[id]        Edit product + replace image
```

---

## Data Flow

### Public (read)

```
User visits /projects or /products
  → Parent Server Component fetches data from Supabase (anon key, server-side)
  → Passes data as props to Client Component (for drag-scroll, filtering, etc.)
  → Images served via Supabase Storage public URLs
```

**Component architecture change required:** `ProjectIndex.tsx` and `ProductsIndex.tsx` are currently `'use client'` components that import static data directly. They will be split:

- New Server Component (e.g. `ProjectsPage`) fetches data from Supabase server-side
- Existing Client Component receives data as props and handles interactive behavior (drag-scroll, category filtering)

This preserves the interactive behavior while enabling server-side data fetching.

### Admin (write)

```
Admin submits form in /admin
  → Next.js Server Action runs (server-side only)
  → Validates input
  → Uploads image file to Supabase Storage (service role key — never exposed to browser)
  → Saves record + image path to database
  → Calls revalidatePath() to invalidate public page cache
  → Redirects back to list
```

---

## Error Handling

- **Upload failure:** Show inline error message. Do not write the database record if the storage upload fails.
- **Missing images:** Fall back to a placeholder. The public site already handles optional images.
- **Auth failure:** Middleware redirects to `/admin/login`. No error details exposed publicly.
- **DB errors:** Surface a user-friendly message in the admin panel.

---

## Public Site Changes

- `app/projects/page.tsx` — becomes a Server Component, fetches projects from Supabase, passes to `ProjectIndex`
- `app/products/page.tsx` — becomes a Server Component, fetches products from Supabase, passes to `ProductsIndex`
- `ProjectIndex.tsx` — accepts `projects` as props instead of importing static data
- `ProductsIndex.tsx` — accepts `products` as props instead of importing static data
- `ProjectCard.tsx` — use `facebook_url` instead of `url`; render images via Supabase Storage URL
- `types/index.ts` — add `'school'` to `ProjectCategory`; rename `url` to `facebook_url` on `Project`; remove `priceLabel` from `Product`
- `data/projects.ts` and `data/products.ts` — deleted after migration

---

## SQL Migrations

Use the **Supabase CLI** for migrations. Migration files live in `/supabase/migrations/`.

Initial migration (`supabase/migrations/001_initial_schema.sql`):

```sql
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
```

---

## Migration Plan

One-time setup steps before going live:

1. Create Supabase project and copy credentials to `.env.local`
2. Run `supabase db push` to apply migrations
3. Create `project-images` and `product-images` storage buckets (set to public)
4. Update `next.config.ts` with Supabase Storage remote pattern
5. Seed the 10 existing projects from `data/projects.ts` via the admin panel or Supabase dashboard
6. Upload existing images from `/public/projects/` to the `project-images` bucket
7. Seed the 15 existing products from `data/products.ts` via the admin panel *(no images to migrate — existing products have no image files)*
8. Verify public pages render correctly
9. Delete `data/projects.ts` and `data/products.ts`

---

## Environment Variables

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
SESSION_SECRET=
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for browser (read-only)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used in Server Actions for storage uploads and admin DB writes
- `ADMIN_PASSWORD` — server-only, verified at login
- `SESSION_SECRET` — server-only, used to sign the session cookie HMAC

---

## Out of Scope

- Video uploads (client uses YouTube/Facebook iframes)
- Client-side photo submission for quotation requests
- Multiple admin users or role-based access
- Supabase Auth
- Services page content management
- Automated tests
