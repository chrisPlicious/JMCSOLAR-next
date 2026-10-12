---
name: JMC Solar PH
description: "Future is Electric — solar installation services, Ormoc City, Leyte, Philippines"
source-of-truth: "app/globals.css (tokens) + components/ui (primitives). This file is the prose. lib/design-guard.test.ts enforces it."
colors:
  navy-950: "#0a1428"   # ink, dark bands, footer
  navy-900: "#0f1f40"   # dark cards, secondary button
  navy-800: "#162d5a"
  navy-700: "#1e3a6e"   # info text on navy-50
  navy-600: "#2c4479"
  navy-500: "#3b4f8a"   # focus ring on light surfaces, input focus
  navy-400: "#6b80a6"
  navy-300: "#97a8c4"
  navy-200: "#c3cedf"
  navy-100: "#e1e7f0"
  navy-50: "#f1f4f9"    # the only tinted surface
  solar-700: "#b45309"  # amber text on light surfaces
  solar-600: "#d97706"
  solar-500: "#f59e0b"  # CTA fill
  solar-400: "#fbbf24"  # amber text on navy, focus ring on navy
  solar-300: "#fcd34d"  # interactive hover border
  solar-200: "#fde68a"
  solar-100: "#fef3c7"
  solar-50: "#fffbeb"
  green-eco: "#22c55e"
  green-eco-bg: "#dcfce7"
  neutral: "slate (only)"
roles:
  fg: "navy-950 | white on dark"
  fg-muted: "slate-600 | white/80 on dark"
  fg-subtle: "slate-500 (white backgrounds only) | white/60 on dark"
  line: "slate-200 | white/10 on dark"
  solar-ink: "solar-700 | solar-400 on dark"
typography:
  display: { font: Poppins, size: "clamp(2.25rem, 1.2rem + 4.4vw, 5rem)", weight: 900, leading: 1.02, tracking: "-0.025em", use: "home hero h1 only" }
  h1:      { font: Poppins, size: "clamp(2rem, 1.5rem + 2.2vw, 3.75rem)", weight: 900, leading: 1.06, tracking: "-0.02em" }
  h2:      { font: Poppins, size: "clamp(1.625rem, 1.3rem + 1.4vw, 2.75rem)", weight: 800, leading: 1.12, tracking: "-0.015em" }
  h3:      { font: Poppins, size: "clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)", weight: 700, leading: 1.25, tracking: "-0.01em" }
  title:   { font: Geist, size: "1.125rem", weight: 600, leading: 1.4 }
  lead:    { font: Geist, size: "clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)", weight: 400, leading: 1.6 }
  body:    { font: Geist, size: "1rem", weight: 400, leading: 1.65 }
  eyebrow: { font: Geist, size: "0.75rem", weight: 600, tracking: "0.08em", case: uppercase }
  wordmark: { font: Montserrat, weights: [500, 800], use: "JMC SOLAR logotype only" }
rounded:
  control: "12px"   # inputs, chips, icon tiles, list rows
  card: "20px"
  panel: "28px"     # CTA band, large feature panels
  full: "9999px"    # every button
shadows:
  soft: "0 1px 2px rgb(15 31 64 / .04), 0 2px 12px rgb(15 31 64 / .05)"
  card: "0 4px 24px rgb(15 31 64 / .07)"
  card-hover: "0 12px 40px rgb(15 31 64 / .12)"
  elevated: "0 16px 48px rgb(15 31 64 / .12)"
  glow-solar: "0 8px 28px rgb(245 158 11 / .28)"
spacing:
  gutter: "16 / 24 / 32px (px-4 sm:px-6 lg:px-8)"
  section: "64 / 80 / 96px (py-16 sm:py-20 lg:py-24)"
  container: "wide 80rem · narrow 64rem · prose 48rem"
---

# Design System: JMC Solar PH

## 1. Overview

**Creative North Star: "The Sun Contractor."** A licensed expert who works in the field, not a showroom. Deep navy is the structural bedrock: JMC has been at this long enough to know what it is doing. Solar amber is the activation signal. It fires only where there is a decision to make.

This is a Filipino engineering firm at the frontier of the energy transition in the Visayas. It is not a wellness brand and not a SaaS startup. Every visual decision passes one test: would a licensed engineer from Ormoc City approve of it as a craft decision made with purpose?

The site's job is to earn trust fast enough to get a booking.

**How the system is enforced:**
- `app/globals.css` holds every token.
- `components/ui/` holds every primitive.
- `lib/design-guard.test.ts` fails the test run when code bypasses them. It catches inline fonts, arbitrary sizes, radii and shadows, hex colours, purple, gray, amber, low-contrast text, and internal `<a href>`.

If you need something the system doesn't have, add a token or primitive. Don't write a one-off.

## 2. Colour: authority + ignition

- **Navy is the brand.** `navy-950` is the ink colour for headings and strong text on light surfaces, and the fill for dark bands and the footer. The light tints (`navy-50`…`400`) are derived from the navy hue itself. They replaced Tailwind indigo values that rendered lavender.
- **Solar amber is action.**
  - `solar-500` fills primary buttons and marks active states.
  - Amber *text* is `solar-700` on light surfaces and `solar-400` on navy. `text-solar-ink` switches between them automatically.
- **Green is status only.** `green-eco` and `green-eco-bg` are for success and "system active". Never structural.
- **Slate is the only neutral.** `gray-*`, `zinc-*`, `neutral-*` and `amber-*` are not used. Neither are purple, violet or indigo.

### Surfaces

There are three surfaces, and only three:

| Surface | Class | Use |
|---|---|---|
| White | `bg-white` | Default |
| Tint | `bg-navy-50` | Alternating bands, product photo stages |
| Dark | `surface-dark bg-navy-950` | Page heroes, CTA band, reviews, footer |

Neighbouring sections alternate so each one reads as its own band. Never put two identical tones back to back. There is no cream, beige or "warm" surface.

### Text roles (surface-aware)

Use these instead of raw colours. `.surface-dark` redefines them, so one component works on both surfaces.

| Role | Light | Dark (`.surface-dark`) |
|---|---|---|
| `text-fg` | navy-950 | white |
| `text-fg-muted` | slate-600 (7.5:1) | white/80 |
| `text-fg-subtle` | slate-500 (4.76:1), **white backgrounds only** | white/60 |
| `border-line` | slate-200 | white/10 |
| `text-solar-ink` | solar-700 | solar-400 |

- `slate-300` and `slate-400` are never used for text; they fail AA.
- White on navy uses only /100, /80 and /60.

### Named rules

**The Ignition Rule.** Amber covers 15% or less of any screen: a primary button, an active state, a focus ring on navy. A two-tone "accent word" inside a heading is allowed only in the home hero h1 and in headings on a navy band. Amber-500 text on white fails contrast.

**The Navy Bedrock Rule.** If a section could be any colour, choose white or navy, never a tinted grey.

## 3. Typography

| Role | Family | Weights | Class |
|---|---|---|---|
| Headings | Poppins | 700 / 800 / 900 | `font-display` (default on h1–h3) |
| Body | Geist | 400–600 | `font-sans` (default) |
| Wordmark | Montserrat | 500 / 800 | `font-wordmark`, only for the JMC SOLAR logotype |

Poppins at heavy weight reads like a contractor's stamped plan. Geist opens it up for reading.

### Scale

Every heading uses a token that bundles size, line-height, tracking and weight:

| Token | Weight | Use |
|---|---|---|
| `text-display` | 900 | Home hero h1 only |
| `text-h1` | 900 | One per page (PageHero does this) |
| `text-h2` | 800 | Section headings (SectionHeader, CtaBand) |
| `text-h3` | 700 | Card and feature titles |
| `text-title` | 600, Geist | List-item and form-section titles |
| `text-lead` | 400 | Intro paragraphs, max 60ch |
| `text-base` / `text-sm` / `text-xs` | — | Body, secondary, captions |

Weight steps down one level at a time (900, 800, 700), so each heading level differs in weight as well as size. Sizes are fluid with `clamp()`. The display size bottoms out at 36px so "Installation" fits a 375px screen.

- Nothing is set below `text-xs` (12px).
- There are no arbitrary `text-[Npx]` sizes.
- Body copy is at most 65ch wide. Headings balance their line breaks (the h1–h3 base style), and paragraphs avoid orphans (`text-pretty`).

### Eyebrows

The `eyebrow` utility (12px / 600 / uppercase / 0.08em / `solar-ink`) appears **at most once per page, and only when it carries information**: a service category, a city, a count. Decorative section kickers ("Who we are", "Trusted brands") are not used. Dense UI such as admin table headers uses the `caps` utility, which is the same shape in `fg-subtle`.

## 4. Shape and elevation

- **Radius:**
  - `rounded-control` (12px): inputs, chips, icon tiles, list rows
  - `rounded-card` (20px): cards
  - `rounded-panel` (28px): the CTA band and large panels
  - `rounded-full`: every button
  - No other radii.
- **Shadows** are navy-tinted and respond to state:
  - `shadow-soft` for resting cards
  - `shadow-card` for floating forms
  - `shadow-card-hover` on hover
  - `shadow-elevated` for navbar, menus and dialogs
  - `shadow-glow-solar` for primary button hover
  - Tailwind's `shadow-sm`…`2xl` are not used.
- **Borders:** `border-line` for hairlines, and `solar-300` on interactive hover. `border-left`/`border-right` accent stripes are not used.

## 5. Layout

- **`Container`:** `wide` (80rem), `narrow` (64rem) or `prose` (48rem), always with the site gutter (16 / 24 / 32px).
- **`Section`:** `tone` of white, tint or dark; `spacing` of default (64 / 80 / 96px) or compact.
- **Page top:** `PageHero` owns the space that clears the fixed navbar. Pages never add their own `pt-28`/`pt-32`.

## 6. Components (`components/ui/`)

| Component | Contract |
|---|---|
| `Button` | Variants: `primary` (solar fill, navy-950 text; never white text on amber), `secondary` (navy), `outline` (light surfaces), `outline-dark` (navy surfaces), `ghost`, `link`, `danger`. Sizes: `sm` / `md` / `lg` / `icon` / `inline`. Pill only. Press scales to 0.97. `href="/…"` renders `next/link`. `loading` shows a spinner and blocks interaction. Raw styled `<button>`s are not used. |
| `Field`, `Input`, `Select`, `Textarea`, `Label`, `FieldError`, `FieldHint` | One boxed style everywhere: white fill, slate-300 border, 44px tall, 16px text, slate-500 placeholder, navy-500 border plus ring on focus. Errors show an icon and text. `Field` wires `id`, `aria-invalid` and `aria-describedby`. |
| `Card` / `cardVariants` | Variants: `default`, `interactive` (lift, `card-hover` shadow, solar-300 border), `tint`, `dark`, `link-row`. |
| `Badge` | Tones carry meaning: `neutral`, `solar`, `success`, `danger`, `info`, `dark`, `on-dark`. Category strings map to tones through `badgeToneFor`. |
| `PageHero` | The one interior header. Navy band, a single h1, a lead, optional actions, optional photo `media` behind a navy scrim, and `size="compact"` for transactional pages. There's no visible breadcrumb trail by choice; breadcrumb JSON-LD for search engines stays in the pages. |
| `SectionHeader` / `Eyebrow` | An h2 plus an optional lead. Left-aligned by default; centred only for short interstitials. |
| `CtaBand` | The one closing CTA. Primary action "Get a quote" → `/booking`; secondary "Message us" → `/#contact`. |
| `EmptyState` | States what is missing and what to do next. |
| `StatusCard` | Confirmation and stub-checkout pages. Always inside the site Layout. |
| `MotionProvider` + `lib/motion.ts` | `reducedMotion="user"`. Shared `fadeUp` / `stagger` / `revealOnScroll`. Ease-out only. |

### The signature: the module grid

Page heroes and the CTA band carry one faint line texture (`texture-module`). It is drawn from real PV module geometry: 28px cells, 6 × 10 cells to a module, with a heavier module frame. It fades out toward the left-aligned copy. It is the system's only decorative element. Don't add dot grids, glow blobs or gradients beside it.

### Home hero

The full-bleed photo hero is the one page top that isn't a `PageHero`. It carries:
- the `text-display` h1, with the rotating "Future is…" tagline as the page's single eyebrow
- four stat cards in a staggered, floating arrangement on desktop (a 2 × 2 grid on mobile), made of the `frosted` sky-blue glass material

`frosted` is kept deliberately from the original hero and is used nowhere else.

### Navigation

- **Navbar:** a floating pill detached from the page edges. Over the home hero it is dark glass (`surface-dark`, navy-950/30 with a backdrop blur); once scrolled, on every other page, and while the Services menu is open it is solid `bg-white` with `shadow-elevated`. Never translucent white: it turns into a grey band over the navy page heroes. It narrows (`max-w-7xl` → `max-w-5xl`) once scrolled, hides on scroll down past 240px and returns on scroll up (never while a menu is open or a keyboard user is inside it). The active link is navy-950 text with a solar underline indicator (not amber text); a hover highlight slides between links.
- **Services mega menu (desktop):** every service as a tile with a one-line benefit, the planning links (calculator, products, locations), and a flush navy booking side. Opens on hover intent or click; a click-opened menu stays until click outside, Escape or a link. It carries `surface-light` so it stays readable over the dark glass state.
- **Mobile menu:** a full-screen `surface-dark` sheet with large links, service chips (no nested accordion) and the quote, call and message actions pinned in the thumb zone. It traps focus, closes on Escape and locks page scroll.
- **CTA:** "Get a quote" is the same solar pill on desktop and mobile.
- **Links:** all internal links use `next/link`. Nav copy (short labels, one-line benefits) lives in `components/layout/nav-data.ts`.

## 7. Motion and accessibility

- **Contrast:** WCAG AA. 4.5:1 for text; 3:1 for large text and UI boundaries.
- **Focus:** every interactive element shows the global `:focus-visible` ring. It is navy-500 on light surfaces and solar-400 inside `.surface-dark`. Never remove the outline without a replacement.
- **Reduced motion:** `prefers-reduced-motion` is honoured globally. The CSS media block makes animations instant, and framer-motion drops transforms and keeps fades.
- **Easing:** ease-out only, no bounce or elastic. Durations are 150 / 300 / 450ms. Reveals play once.

## 8. Do / Don't

**Do:**
- Use the tokens and primitives.
- Alternate section tones.
- Put one h1 on each page.
- Label only what carries information.
- Use `tabular-nums` for prices, kW/kWh figures and stats.

**Don't:**
- Inline `fontFamily`.
- Arbitrary `text-[…]`, `rounded-[…]` or `shadow-[…]` values.
- Hex colours in components.
- Purple.
- Gray and slate mixed together.
- Amber text on white.
- `slate-400` body copy.
- Numbered markers (01 / 02 / 03) on non-sequential content.
- Gradient text.
- Identical icon-card grids repeated endlessly.
- Cream or beige backgrounds.
- `border-left` accent stripes.
- Nested cards.
- Bounce easing.
