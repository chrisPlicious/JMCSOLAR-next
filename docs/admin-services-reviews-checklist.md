# Admin Service Types CRUD & Admin Reviews — Checklist

## Phase 1 — Database & Types
- [ ] Create migration `supabase/migrations/003_services_reviews.sql` (services + reviews tables, RLS policies)
- [ ] Run migration in Supabase SQL editor
- [ ] Add `DbService` and `DbReview` types to `lib/supabase/types.ts`

## Phase 2 — Service Types Admin CRUD
- [ ] Create `app/admin/services/actions.ts` (create, update, delete Server Actions)
- [ ] Create `app/admin/services/_components/ServiceForm.tsx` (shared form: icon dropdown, title, description, highlight, display_order)
- [ ] Create `app/admin/services/_components/DeleteServiceButton.tsx` (client component with confirm dialog)
- [ ] Create `app/admin/services/page.tsx` (list page — ordered by display_order)
- [ ] Create `app/admin/services/new/page.tsx` (new service page wrapping ServiceForm)
- [ ] Create `app/admin/services/[id]/page.tsx` (edit service page wrapping ServiceForm)

## Phase 3 — Reviews Admin CRUD
- [ ] Create `app/admin/reviews/actions.ts` (create, update, delete Server Actions)
- [ ] Create `app/admin/reviews/_components/ReviewForm.tsx` (shared form: reviewer_name, quote textarea, source dropdown, rating selector)
- [ ] Create `app/admin/reviews/_components/DeleteReviewButton.tsx` (client component with confirm dialog)
- [ ] Create `app/admin/reviews/page.tsx` (list page — ordered by created_at desc)
- [ ] Create `app/admin/reviews/new/page.tsx` (new review page wrapping ReviewForm)
- [ ] Create `app/admin/reviews/[id]/page.tsx` (edit review page wrapping ReviewForm)

## Phase 4 — Admin Nav & Dashboard
- [ ] Add "Services" and "Reviews" nav items to `AdminNav.tsx`
- [ ] Add service/review stat cards + quick action cards to admin `page.tsx`

## Phase 5 — Frontend Migration (Static → Supabase)
- [ ] Migrate `page-components/services/ServiceIndex.tsx` from `data/services` import → Supabase fetch
- [ ] Migrate `page-components/home/Reviews.tsx` from `data/reviews` import → Supabase fetch
- [ ] Migrate `components/layout/Navbar.tsx` if it imports services data → Supabase fetch

## Phase 6 — Verification
- [ ] Verify service CRUD: create, read, update, delete all work in admin
- [ ] Verify review CRUD: create, read, update, delete all work in admin
- [ ] Verify public services page renders from Supabase data
- [ ] Verify public reviews section renders from Supabase data
- [ ] Verify admin nav highlights correctly on services/reviews routes
