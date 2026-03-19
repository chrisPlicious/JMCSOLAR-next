# Service Detail Pages — DB-Driven Design

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Move service detail page content from hardcoded React component files into the Supabase database so admins can create and edit full service detail pages from the admin panel. Services can exist without detail content; missing detail shows a graceful empty state.

---

## Database Schema

### Migration `004_add_slug_to_services.sql`

The `slug` column was added directly to the live database earlier. This migration makes it repeatable for fresh environments. Backfill runs before the NOT NULL constraint to avoid errors on populated tables:

```sql
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: slugify title for any rows without a slug
UPDATE services
SET slug = lower(regexp_replace(title, '[^a-z0-9]+', '-', 'gi'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE services ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key ON services(slug);
```

### Migration `005_service_details.sql`

```sql
CREATE TABLE IF NOT EXISTS service_details (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   uuid NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  tagline      text NOT NULL DEFAULT '',
  overview     text NOT NULL DEFAULT '',
  what_is_it   text NOT NULL DEFAULT '',
  how_it_works jsonb NOT NULL DEFAULT '[]',
  benefits     jsonb NOT NULL DEFAULT '[]',
  use_cases    jsonb NOT NULL DEFAULT '[]',
  specs        jsonb NOT NULL DEFAULT '[]',
  sources      jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service_details"
  ON service_details FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth insert service_details"
  ON service_details FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update service_details"
  ON service_details FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete service_details"
  ON service_details FOR DELETE TO authenticated USING (true);

-- Guard: ensure trigger function exists (created in 003, but declared here for safety)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_details_updated_at ON service_details;
CREATE TRIGGER update_service_details_updated_at
  BEFORE UPDATE ON service_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**"Authenticated" scope:** Any authenticated user — consistent with existing `services`, `products`, `projects` policies. No separate admin role.

### JSONB field shapes

```json
how_it_works: [{ "step": "string", "description": "string" }]
benefits:     [{ "iconName": "string", "title": "string", "description": "string" }]
use_cases:    [{ "item": "string" }]
specs:        [{ "label": "string", "value": "string" }]
sources:      [{ "title": "string", "url": "string", "publisher": "string" }]
```

`use_cases` stores objects `{ item }` so all array fields share the same dynamic-row pattern in the admin form. Before passing to `ServicePageLayout` (which expects `useCases: string[]`), the page maps them: `detail.use_cases.map(u => u.item)`.

### Migration `006_seed_service_details.sql`

Inserts the 7 existing hardcoded service detail contents via slug-based FK lookup. Each block includes an existence assertion so a missing slug causes the migration to fail loudly rather than silently skip:

```sql
-- Assert all 7 slugs exist before inserting
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM services WHERE slug IN ('hybrid','ongrid','bess','pump','ev','ups','controller')) = 7,
    'Seed failed: one or more expected service slugs are missing from the services table.';
END $$;

INSERT INTO service_details (service_id, tagline, overview, what_is_it, how_it_works, benefits, use_cases, specs, sources)
SELECT s.id,
  'tagline...',
  'overview...',
  'what_is_it...',
  '[...]'::jsonb,
  '[...]'::jsonb,
  '[...]'::jsonb,
  '[...]'::jsonb,
  '[...]'::jsonb
FROM services s WHERE s.slug = 'hybrid';
-- Repeated for: ongrid, bess, pump, ev, ups, controller
```

---

## Admin UI

### File changes

| File | Change |
|---|---|
| `app/admin/services/_components/ServiceForm.tsx` | **Replaced wholesale** with a new `'use client'` component using `useActionState` |
| `app/admin/services/actions.ts` | `createService` and `updateService` get new `(prevState, fd)` / `(id, prevState, fd)` signatures |
| `app/admin/services/new/page.tsx` | Passes `createService` (unbound) to form |
| `app/admin/services/[id]/page.tsx` | Fetches `services` + `service_details` rows; passes both + bound action to form |

### Server action signatures

```typescript
type ServiceFormState = { error: string } | null;

// Create — signature compatible with useActionState directly
export async function createService(
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState>

// Update — id is bound by parent page before passing to form
// updateService.bind(null, service.id) → (prevState, fd) => Promise<ServiceFormState>
export async function updateService(
  id: string,
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState>
```

**Parent create page** passes: `action={createService}`
**Parent edit page** passes: `action={updateService.bind(null, service.id)}` — the **bound** version, already reduced to `(prevState, fd)` signature, ready for `useActionState`. The unbound `updateService` must never be passed directly.

`ServiceForm` calls `const [state, dispatch] = useActionState(action, null)` and renders `<form action={dispatch}>`.

### Action logic

Each action:
1. Reads `slug` from `fd.get('slug')` (always present via hidden input in form)
2. Upserts `services` row
3. Checks if detail is non-empty: tagline, overview, or what_is_it are non-empty strings OR any array field has ≥ 1 item
4. If non-empty: upserts `service_details` using `ON CONFLICT (service_id) DO UPDATE SET ...`
5. If all empty: skips `service_details` — does NOT delete an existing row
6. Calls `revalidatePath('/services')` and `revalidatePath('/services/' + slug)`
7. Redirects to `/admin/services` on success; returns `{ error: message }` on failure

### Form props

```typescript
type ServiceFormProps = {
  action: (prevState: ServiceFormState, fd: FormData) => Promise<ServiceFormState>;
  service?: DbService;           // undefined on create
  detail?: DbServiceDetail | null; // null/undefined when no detail row exists yet
};
```

The edit page (`[id]/page.tsx`) fetches both `services` and `service_details` rows and passes both to the form. The detail section is **expanded by default** when `detail` prop is non-null.

### Form layout

**Basic Info** (existing fields + slug):
- Icon (dropdown), Title, Slug (text, auto-filled from title on create, editable), Description (textarea), Display Order, Highlight (checkbox)
- Slug also rendered as a `<input type="hidden" name="slug" />` to ensure it is always in FormData even if the slug field is in a different part of the form

**Detail Page** (new collapsible section; expanded when `detail` is non-null):

| Field | Input type | Row fields |
|---|---|---|
| Tagline | text input | — |
| Overview | textarea | — |
| What Is It | textarea | — |
| How It Works | Dynamic rows | Step Title, Description |
| Benefits | Dynamic rows | Icon Name (Lucide), Title, Description |
| Specs | Dynamic rows | Label, Value |
| Use Cases | Dynamic rows | Item text |
| Sources | Dynamic rows | Title, URL, Publisher |

All array sections use dynamic add/remove rows.

---

## Frontend (Public Pages)

### `app/services/[id]/page.tsx`

The `[id]` segment carries the slug string (e.g., `hybrid`, `controller`). Rewritten as a **server component**:

```typescript
export const revalidate = 60; // ISR: background revalidation every 60s

export default async function ServiceDetailPage({ params }) {
  const { id: slug } = await params;

  const service = await fetchServiceBySlug(slug); // notFound() if null
  const detail = await fetchServiceDetailByServiceId(service.id); // null if no row

  if (!detail) return <ServiceEmptyState service={service} />;

  return (
    <ServicePageLayout
      heroBgImage="/assets/bg-4.jpg"
      title={service.title}
      iconName={service.icon}
      serviceId={service.slug}
      tagline={detail.tagline}
      overview={detail.overview}
      whatIsIt={detail.what_is_it}
      howItWorks={detail.how_it_works}
      benefits={detail.benefits}
      useCases={detail.use_cases.map(u => u.item)}  // [{item}] → string[]
      specs={detail.specs}
      sources={detail.sources}
    />
  );
}
```

Admin saves call `revalidatePath` (immediate cache purge), so edits appear without waiting for the 60s ISR window.

### `ServiceEmptyState` — `components/ui/ServiceEmptyState.tsx`

Props: `{ service: DbService }`

Renders:
- Simplified hero: navy background (no image), service icon + title
- Message: "This service page is coming soon. We're still preparing the details."
- CTA: `← Back to Services` → `/services`
- CTA: `Contact Us to Inquire` → `/#contact`

### `ServicePageLayout`
No changes. Receives `heroBgImage="/assets/bg-4.jpg"` hardcoded in the page component (one default image for all services, by design).

---

## TypeScript Types

`lib/supabase/types.ts` is hand-maintained (no Supabase CLI codegen — safe to edit directly). Add:

```typescript
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
```

---

## Files to Delete

After DB-driven pages are live and verified:
- `page-components/services/HybridPage.tsx`
- `page-components/services/OnGridPage.tsx`
- `page-components/services/BessPage.tsx`
- `page-components/services/PumpPage.tsx`
- `page-components/services/EvPage.tsx`
- `page-components/services/UpsPage.tsx`
- `page-components/services/ControllerPage.tsx`

The route file `app/services/[id]/page.tsx` is rewritten in place.

---

## Implementation Order

1. **Migration 004** — add slug column to services (idempotent, with backfill before NOT NULL)
2. **Migration 005** — `service_details` table + RLS + trigger
3. **Migration 006** — seed all 7 service detail contents via slug lookup
4. **TypeScript type** — add `DbServiceDetail` to `lib/supabase/types.ts`
5. **Empty state component** — `components/ui/ServiceEmptyState.tsx`
6. **Public page rewrite** — `app/services/[id]/page.tsx` as server component + ISR
7. **Admin form** — replace `ServiceForm.tsx` wholesale + new action signatures + update `new/page.tsx` and `[id]/page.tsx`
8. **Cleanup** — delete 7 hardcoded `*Page.tsx` files
