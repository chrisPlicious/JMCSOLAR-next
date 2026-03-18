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
| facebook_url | text | Link to Facebook post |
| cover_image_path | text | Storage path of the main/cover photo |
| created_at | timestamptz | Default now() |

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
| category | text | solar-panels / batteries / inverters / charge-controllers / converters |
| specs | text | |
| description | text | |
| badge | text | Optional — "Best Seller", "New", etc. |
| image_path | text | Storage path in Supabase Storage |
| related_service | text | Links to service type for inquiry pre-fill |
| created_at | timestamptz | Default now() |

No price fields — products drive users to the contact/inquiry form.

---

## Supabase Storage

Two public buckets:

| Bucket | Usage | Structure |
|---|---|---|
| `project-images` | Project photos (multiple per project) | `{project_id}/{filename}` |
| `product-images` | Product photos (one per product) | `{product_id}/{filename}` |

Both buckets are public — images are served via Supabase's public URL, no signed URLs required.

---

## Admin Panel

### Auth Flow

- `ADMIN_PASSWORD` stored in `.env.local` (never committed)
- `/admin/login` — password form, submitted via Next.js Server Action
- Server action verifies password → sets an `httpOnly` session cookie (`admin_session`)
- Next.js middleware protects all `/admin/**` routes — redirects to `/admin/login` if cookie is absent or invalid

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
  → Server Component fetches from Supabase (anon key, server-side)
  → Page renders with live database content
  → Images served via Supabase Storage public URLs
```

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
- **Missing images:** Fall back to a placeholder. The public site already handles optional images (`image?: string`).
- **Auth failure:** Middleware redirects to `/admin/login`. No error details exposed publicly.
- **DB errors:** Surface a user-friendly message in the admin panel.

---

## Public Site Changes

- `ProjectIndex.tsx` — switch from importing `data/projects.ts` to fetching from Supabase
- `ProductsIndex.tsx` — switch from importing `data/products.ts` to fetching from Supabase
- `ProjectCard.tsx` — render `cover_image_path` via Supabase Storage URL instead of local `/public/` path
- `data/projects.ts` and `data/products.ts` — deleted after migration is complete

---

## Migration Plan

One-time manual steps before going live:

1. Create Supabase project and configure environment variables
2. Run SQL migrations to create tables
3. Create `project-images` and `product-images` storage buckets
4. Seed the 10 existing projects from `data/projects.ts` into the database
5. Seed the 15 existing products from `data/products.ts` into the database
6. Upload existing images from `/public/projects/` to Supabase Storage
7. Verify public pages render correctly
8. Delete static data files

---

## Environment Variables

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

`SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are server-only (no `NEXT_PUBLIC_` prefix).

---

## Out of Scope

- Video uploads (client uses YouTube/Facebook iframes)
- Client-side photo submission for quotation requests
- Multiple admin users or role-based access
- Supabase Auth
- Services page content management
