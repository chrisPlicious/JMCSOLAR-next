# Admin Panel Bento Redesign

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Redesign the admin panel with a balanced bento-UI aesthetic. The main area stays light (`bg-slate-50`) with visually rich, distinct bento cards and some dark/glass elements for contrast. Scope covers: dashboard, all list views (products, projects, services, reviews), all forms, and the sidebar.

---

## Design Principles

- **Light base, rich tiles** — `bg-slate-50` main area, white cards with strong borders/shadows
- **Dark accents** — welcome banner and sidebar retain dark navy DNA; glass/dark elements used sparingly for contrast
- **Balanced density** — medium card sizes, good visual hierarchy, prominent numbers, professional SaaS feel
- **Solar-500 orange + navy** — primary accent colors throughout, consistent with the public site brand

---

## 1. Sidebar

### Files modified:
- `app/admin/_components/AdminNav.tsx` — full redesign; change `w-56` → `w-64`
- `app/admin/layout.tsx` — change `ml-56` → `ml-64`

**Width:** `w-64` (256px). Both files must be updated together.

**Structure (top to bottom):**

### Site Identity Block
```
☀  JMC Solar PH        ← logo icon (solar-500 bg, w-9 h-9 rounded-xl) + bold white title
   Admin Panel          ← subtitle in white/50 text-xs
   View live site ↗     ← <a href="/" target="_blank"> in text-solar-400/60 text-xs hover:text-solar-400
```

### Navigation
Section label: `MAIN MENU` — `text-[10px] font-bold uppercase tracking-widest text-white/30 px-4 mb-2`

Nav items (Dashboard, Projects, Products, Services, Reviews):
- Row: `flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 transition-all duration-200`
- Icon container: `w-7 h-7 rounded-lg flex items-center justify-center` — `bg-white/15` on active, `bg-white/0` on inactive
- Active state: `bg-white/10 text-white` + `border-l-[3px] border-solar-500 -ml-[3px] pl-[calc(1rem+3px)]`
- Inactive: `text-white/60 hover:text-white hover:bg-white/8`

### Account Section
Pinned to bottom via `mt-auto`. Separated by `border-t border-white/8 pt-4`.

Section label: `ACCOUNT`

- Display name: hardcoded `"Admin"` — rendered as `text-sm font-medium text-white/70`. No dynamic user identity exists in the auth system (cookie-only auth with no user record).
- Sign Out button: existing form-based logout, styled `text-white/50 hover:text-white/80 text-sm transition-colors`

---

## 2. Dashboard

### File: `app/admin/page.tsx`

### Grid Structure

```css
grid grid-cols-4 gap-4
```

Explicit row layout using `grid-rows` is not needed — natural flow with `col-span` and `row-span` handles placement:

**Row 1:** Welcome Banner (`col-span-2 row-span-2`) + Projects Stat (`col-span-1`) + Products Stat (`col-span-1`)
**Row 2 (continues banner):**                          + Services Stat (`col-span-1`) + Reviews Stat (`col-span-1`)
**Row 3:** Quick Actions (`col-span-2`) + [fills remaining 2 cols naturally from stat cards above]
**Row 4:** Recent Activity (`col-span-4`)

Implemented as:
```tsx
<div className="grid grid-cols-4 gap-4">
  <WelcomeBanner className="col-span-2 row-span-2" />
  <StatCard />  {/* Projects */}
  <StatCard />  {/* Products */}
  <StatCard />  {/* Services */}
  <StatCard />  {/* Reviews */}
  <QuickActionsCard className="col-span-2" />
  <RecentActivity className="col-span-4" />
</div>
```

### Welcome Banner (`col-span-2 row-span-2`)
- Background: `bg-navy-950` with CSS grid texture overlay:
  `background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 32px 32px`
- Content: solar-500 8px accent dot + `"JMC Solar PH"` in `text-2xl font-black text-white` + `"Admin Panel"` in `text-xs uppercase tracking-widest text-white/40` + `"View live site ↗"` link + current date in `text-white/30 text-xs`
- Rounded: `rounded-2xl p-6 flex flex-col justify-between`

### Stat Cards (×4, `col-span-1` each)
- Top accent bar: `h-1 w-full rounded-t-2xl absolute top-0 left-0` — solar-500 (projects), blue-500 (products), emerald-500 (services), violet-500 (reviews)
- Card: `relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-5`
- Number: `text-5xl font-black text-navy-950`
- Label: `text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1`
- Delta badge: `text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600` (omit if no delta data available)
- Secondary line per card:
  - Projects: hardcoded "residential · commercial · agricultural"
  - Products: "across N categories" (count distinct categories)
  - Services: "N featured" (count where highlight = true)
  - Reviews: "★ X.X avg" (avg of rating column)

### Quick Actions Card (`col-span-2`)
- White card, `rounded-2xl border border-slate-100 p-5`
- Header: `"Quick Actions"` in `text-xs font-bold uppercase tracking-widest text-slate-400 mb-3`
- Four `<Link>` rows: `flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-solar-500/5 hover:text-solar-600 transition-all`
- Icon (`w-8 h-8 rounded-lg bg-slate-100`) + label + `ArrowRight` size-14 at far right
- Rows separated by `border-b border-slate-50` (not last)

### Recent Activity Strip (`col-span-4`)
- White card, full width, `rounded-2xl border border-slate-100 p-5`
- Header: `"Recent Activity"` label + `"View all"` link at right
- **Data:** The dashboard is a server component. Two Supabase queries run server-side — `projects` select `(id, title, created_at)` + `products` select `(id, name as title, created_at)`, each ordered by `created_at DESC limit 5`. Results are merged and re-sorted server-side in JavaScript (array spread + sort by `created_at`), top 5 taken. A `type` label (`'project'` | `'product'`) is added during the merge. No client-side fetching.
- **Row display:** colored dot (navy for project, solar for product) + type label badge + `title` in `font-medium` + relative timestamp (`"2h ago"`) in `text-slate-400 text-xs`
- Empty state: `"No recent activity"` in `text-slate-400 text-sm text-center py-4`

---

## 3. List Views

Applied to all four sections: Products, Projects, Services, Reviews.

### Page Header Pattern

```tsx
<div className="mb-6">
  <div className="flex items-center justify-between mb-1">
    <h1 className="font-display font-black text-navy-950 text-2xl">{title}</h1>
    <Link href="/admin/{section}/new" className="bg-solar-500 ...">+ New {item}</Link>
  </div>
  <p className="text-slate-500 text-sm">{subtitle}</p>
</div>

{/* Mini bento stat strip */}
<div className="grid grid-cols-4 gap-3 mb-6">
  <MiniStatCard number={n} label="Total" />
  ...
</div>
```

**MiniStatCard:** `bg-white rounded-xl border border-slate-100 p-4 shadow-sm` — bold number in `text-2xl font-black text-navy-950` + label in `text-xs text-slate-400 uppercase tracking-widest mt-0.5`

**Per-section stats:**
- Products: Total, Categories (distinct count), Panels count, Batteries count
- Projects: Total, Residential, Commercial, Agricultural
- Services: Total, Featured (highlight=true), Display order range ("1–N")
- Reviews: Total, Avg Rating ("★ X.X"), Google count, Facebook count

### Table Upgrades

Applied to all existing list page table components:

- **Table wrapper:** `bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]`
- **Header row:** `bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-400`
- **Row alternation:** `odd:bg-white even:bg-slate-50/50`
- **Row hover:** `hover:bg-solar-500/5 transition-colors duration-150`
- **Badges:** `px-2.5 py-0.5 rounded-full text-xs font-semibold` — consistent colors per type across all sections
- **Actions column:** Keep existing Edit and Delete as two separate icon-buttons but restyle: small `p-2 rounded-lg` buttons — Edit in `text-slate-400 hover:text-navy-900 hover:bg-slate-100`, Delete in `text-slate-400 hover:text-red-500 hover:bg-red-50`. No dropdown needed — the existing two-button pattern is simpler and already works.
- **Empty state:** `<div className="text-center py-16">` — large Lucide icon (`size-12 text-slate-200`), `<p>` heading in `text-slate-400 font-medium`, subtext in `text-slate-300 text-sm`, CTA button

### New / CTA Button Style (consistent across all pages)
`bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors`

---

## 4. Forms

Applied to all create/edit forms across all sections.

### Sticky Save Bar
Fixed bar at bottom of viewport. No "unsaved changes" detection — the bar is always visible on form pages (simple and reliable for an admin tool):

```tsx
<div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_0_rgb(0_0_0/0.06)] px-8 py-4 flex items-center justify-end gap-3 z-30">
  <Link href="/admin/{section}" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</Link>
  <button type="submit" disabled={isPending} className="bg-solar-500 ...">
    {isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
  </button>
</div>
```

Note: `left-64` aligns the bar with the main content area (matches sidebar width). The admin layout uses a simple `flex` + `ml-64` structure with no `transform`, `filter`, or `will-change` on any ancestor — `fixed left-64 right-0` anchors correctly to the viewport. The existing Cancel link and Submit button inside the form card are removed — the sticky bar replaces them.

**Responsive scope:** The admin panel is desktop-only. No responsive/mobile behavior is required. Minimum supported width is 1024px.

### Section Dividers
```tsx
<div className="flex items-center gap-3 my-6">
  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
    Basic Info
  </span>
  <hr className="flex-1 border-slate-100" />
</div>
```

### Form Card
`bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-8 max-w-3xl mb-24`

`mb-24` prevents content from being hidden behind the fixed save bar.

### Input Enhancements
- Focus ring: `focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500` (make consistent across all forms)
- Error state: `state?.error` banner kept at top of form card (existing pattern) — no per-field inline errors (avoids complexity)

---

## Files to Modify

| File | Change |
|---|---|
| `app/admin/_components/AdminNav.tsx` | Full redesign; `w-56` → `w-64` |
| `app/admin/layout.tsx` | `ml-56` → `ml-64` |
| `app/admin/page.tsx` | Full dashboard bento grid redesign |
| `app/admin/products/page.tsx` | Add mini bento stat strip + table upgrades |
| `app/admin/projects/page.tsx` | Add mini bento stat strip + table upgrades |
| `app/admin/services/page.tsx` | Add mini bento stat strip + table upgrades |
| `app/admin/reviews/page.tsx` | Add mini bento stat strip + table upgrades |
| `app/admin/products/_components/NewProductForm.tsx` | Section dividers + sticky save bar |
| `app/admin/products/_components/EditProductForm.tsx` | Section dividers + sticky save bar |
| `app/admin/projects/_components/NewProjectForm.tsx` | Section dividers + sticky save bar |
| `app/admin/projects/_components/EditProjectForm.tsx` | Section dividers + sticky save bar |
| `app/admin/services/_components/ServiceForm.tsx` | Section dividers + sticky save bar |
| `app/admin/reviews/_components/ReviewForm.tsx` | Section dividers + sticky save bar |

---

## Implementation Order

1. Sidebar (`AdminNav.tsx` + `layout.tsx`)
2. Dashboard (`page.tsx`) — bento grid + welcome banner + stat cards + quick actions + activity
3. List view headers — mini bento stat strips (all 4 sections)
4. Table upgrades — row styles + badges + icon action buttons + empty states (all 4 sections)
5. Form upgrades — section dividers + sticky save bar + mb-24 (all 6 form components)
