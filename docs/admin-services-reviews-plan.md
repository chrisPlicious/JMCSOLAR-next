# Admin Service Types CRUD & Admin Reviews

Add two new admin-managed entities backed by Supabase: **Service Types** (full CRUD) and **Reviews** (admin pastes reviews from Facebook/Google).

---

## Current State

- **Services** — hardcoded in `data/services.ts` (7 items: id, icon, title, description, highlight)
- **Reviews** — hardcoded in `data/reviews.ts` (10 items: id, name, rating, quote, source)
- Neither exists as a Supabase table — both are static TypeScript arrays
- Existing admin CRUD pattern (Products/Projects): Supabase table → Server Actions → form components → list/edit/new pages

---

## Phase 1 — Database & Types

### 1.1 Create migration `supabase/migrations/003_services_reviews.sql`

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  icon text not null,           -- Lucide icon name e.g. 'Sun', 'Battery'
  title text not null,
  description text not null,
  highlight text,               -- optional badge e.g. 'Most Popular'
  display_order int default 0,
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  rating int not null default 5,
  quote text not null,
  source text not null,          -- 'Google' or 'Facebook'
  created_at timestamptz default now()
);

alter table services enable row level security;
alter table reviews enable row level security;

create policy "Public read services" on services for select to anon, authenticated using (true);
create policy "Public read reviews" on reviews for select to anon, authenticated using (true);
```

### 1.2 Run migration in Supabase SQL editor

### 1.3 Add `DbService` and `DbReview` types to `lib/supabase/types.ts`

---

## Phase 2 — Service Types Admin CRUD

### 2.1 `app/admin/services/actions.ts`
- `createServiceAction` — insert new service (icon, title, description, highlight, display_order)
- `updateServiceAction` — update existing service by id
- `deleteServiceAction` — delete by id

### 2.2 `app/admin/services/_components/ServiceForm.tsx`
Shared form component (used for both new & edit):
- **Icon** — dropdown of Lucide icon names (Sun, Zap, Battery, Droplets, Car, ShieldCheck, SlidersHorizontal, etc.)
- **Title** — text input
- **Description** — textarea
- **Highlight** — optional text input (e.g. "Most Popular")
- **Display Order** — number input

### 2.3 `app/admin/services/_components/DeleteServiceButton.tsx`
Client component with `window.confirm()` before calling delete action.

### 2.4 `app/admin/services/page.tsx`
List page — fetches all services ordered by `display_order`, shows icon name, title, highlight badge, edit/delete actions.

### 2.5 `app/admin/services/new/page.tsx`
Renders `ServiceForm` in create mode.

### 2.6 `app/admin/services/[id]/page.tsx`
Fetches service by id, renders `ServiceForm` in edit mode.

---

## Phase 3 — Reviews Admin CRUD

### 3.1 `app/admin/reviews/actions.ts`
- `createReviewAction` — insert new review
- `updateReviewAction` — update existing review by id
- `deleteReviewAction` — delete by id

### 3.2 `app/admin/reviews/_components/ReviewForm.tsx`
Shared form component:
- **Reviewer Name** — text input
- **Quote** — textarea (for pasting from Facebook/Google)
- **Source** — dropdown: `Google` | `Facebook`
- **Rating** — number selector 1–5

### 3.3 `app/admin/reviews/_components/DeleteReviewButton.tsx`
Client component with confirm dialog.

### 3.4 `app/admin/reviews/page.tsx`
List page — ordered by `created_at` desc, shows reviewer name, source badge, star rating, truncated quote, edit/delete actions.

### 3.5 `app/admin/reviews/new/page.tsx`
Renders `ReviewForm` in create mode.

### 3.6 `app/admin/reviews/[id]/page.tsx`
Fetches review by id, renders `ReviewForm` in edit mode.

---

## Phase 4 — Admin Nav & Dashboard

### 4.1 Update `app/admin/_components/AdminNav.tsx`
Add two new nav items with icons:
- **Services** → `/admin/services`
- **Reviews** → `/admin/reviews`

### 4.2 Update `app/admin/page.tsx`
- Add stat cards for Services count and Reviews count
- Add quick action cards linking to `/admin/services` and `/admin/reviews`

---

## Phase 5 — Frontend Migration (Static → Supabase)

### 5.1 `page-components/services/ServiceIndex.tsx`
Replace `import { services } from '@/data/services'` → Supabase `select` from `services` table.

### 5.2 `page-components/home/Reviews.tsx`
Replace `import { reviews } from '@/data/reviews'` → Supabase `select` from `reviews` table.

### 5.3 `components/layout/Navbar.tsx`
If it imports services data, switch to Supabase fetch.

---

## Phase 6 — Verification

- [ ] Service CRUD: create, read, update, delete in admin
- [ ] Review CRUD: create, read, update, delete in admin
- [ ] Public services page renders from Supabase
- [ ] Public reviews section renders from Supabase
- [ ] Admin nav highlights correctly on services/reviews routes

---

## Files Modified / Created

| Action | File |
|--------|------|
| NEW | `supabase/migrations/003_services_reviews.sql` |
| MODIFY | `lib/supabase/types.ts` |
| NEW | `app/admin/services/actions.ts` |
| NEW | `app/admin/services/_components/ServiceForm.tsx` |
| NEW | `app/admin/services/_components/DeleteServiceButton.tsx` |
| NEW | `app/admin/services/page.tsx` |
| NEW | `app/admin/services/new/page.tsx` |
| NEW | `app/admin/services/[id]/page.tsx` |
| NEW | `app/admin/reviews/actions.ts` |
| NEW | `app/admin/reviews/_components/ReviewForm.tsx` |
| NEW | `app/admin/reviews/_components/DeleteReviewButton.tsx` |
| NEW | `app/admin/reviews/page.tsx` |
| NEW | `app/admin/reviews/new/page.tsx` |
| NEW | `app/admin/reviews/[id]/page.tsx` |
| MODIFY | `app/admin/_components/AdminNav.tsx` |
| MODIFY | `app/admin/page.tsx` |
| MODIFY | `page-components/services/ServiceIndex.tsx` |
| MODIFY | `page-components/home/Reviews.tsx` |
| MODIFY | `components/layout/Navbar.tsx` |
