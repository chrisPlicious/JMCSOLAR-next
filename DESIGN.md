---
name: JMC Solar PH
description: "Future is Electric — solar installation services, Ormoc City, Leyte, Philippines"
colors:
  navy-midnight: "#0a1428"
  navy-deep: "#0f1f40"
  navy-authority: "#162d5a"
  navy-mid: "#1e3a6e"
  navy-active: "#3b4f8a"
  navy-tint: "#eef2ff"
  solar-ignition: "#f59e0b"
  solar-warm: "#fbbf24"
  solar-glow: "#fcd34d"
  solar-deep: "#d97706"
  solar-burnt: "#b45309"
  green-field: "#22c55e"
  green-field-bg: "#dcfce7"
  surface-white: "#ffffff"
  surface-warm: "#fbf9f6"
  ink-primary: "#0a1428"
  ink-secondary: "#1e3a6e"
  ink-muted: "#64748b"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.solar-ignition}"
    textColor: "{colors.navy-deep}"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.solar-warm}"
    textColor: "{colors.navy-deep}"
  button-secondary:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  button-secondary-hover:
    backgroundColor: "{colors.navy-authority}"
    textColor: "{colors.surface-white}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.navy-mid}"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  card-service:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.none}"
    padding: "24px 32px"
  input-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: JMC Solar PH

## 1. Overview

**Creative North Star: "The Sun Contractor"**

A licensed expert who works in the field, not a showroom. The design system holds two registers in deliberate tension: the institutional weight of a proven trade business and the electric confidence of a brand pushing its region toward the energy transition. Deep navy provides structural bedrock — it communicates that JMC has been at this long enough to know what they're doing. Solar amber is the activation signal — it fires when there's a decision to make, a button to press, an appointment to book.

This is not a wellness brand. It is not a SaaS startup. It is a Filipino engineering firm operating at the frontier of energy transition in the Visayas. Every visual decision passes one test: would a licensed engineer from Ormoc City approve of this? Not as ornamentation — as a craft decision made with purpose. The brand is assertive about the work without being theatrical about itself.

The site's job is to earn trust fast enough to get a booking. That means typography that reads with authority, color that signals expertise over hype, and components that feel tactile and confident — like tools, not toys.

**Key Characteristics:**
- Navy midnight as brand bedrock; solar amber as ignition and action
- Pill-shaped buttons with genuine tactile feedback (scale-down on press)
- Poppins headlines at heavy weight with tight tracking — engineered, not decorative
- Shadows are diffuse and navy-tinted; they describe depth, not drama
- Backdrop-blur navbar that earns its effect through genuine layering
- Booking flows feel inevitable: each step is visually clear, never cluttered
- Framer Motion used for purposeful micro-interactions, not ambient choreography

## 2. Colors: The Authority + Ignition Palette

A two-force palette: institutional navy authority anchors the system; solar amber ignites it at points of action and brand identity. Eco green appears sparingly as a status and environmental signal — never as the lead.

### Primary (Brand Identity — Navy)

- **Navy Midnight** (`#0a1428`): The deepest structural color. Used for full-bleed section backgrounds, the booking split-layout left panel, and display text on light surfaces. This is the brand's visual weight.
- **Navy Deep** (`#0f1f40`): Section backgrounds, secondary panel fills, button secondary background.
- **Navy Authority** (`#162d5a`): Hover states for secondary buttons, border accents on dark surfaces.
- **Navy Mid** (`#1e3a6e`): Muted text and icon tints on dark backgrounds; divider lines on light surfaces.
- **Navy Active** (`#3b4f8a`): Interactive state for secondary elements, focus rings on dark contexts.
- **Navy Tint** (`#eef2ff`): Hover backgrounds for nav links, chip backgrounds in light contexts.

### Secondary (Action — Solar Amber)

- **Solar Ignition** (`#f59e0b`): The primary CTA color. All `default` and `primary` button backgrounds. Active nav state tint. The brand's forward-looking signal. Used for ≤15% of any given surface.
- **Solar Warm** (`#fbbf24`): Button hover state for primary. Slightly lighter, maintains amber character.
- **Solar Glow** (`#fcd34d`): Hover accents on interactive service cards; background of active tag chips.
- **Solar Deep** (`#d97706`): Darker amber for body text that needs amber warmth without losing contrast.
- **Solar Burnt** (`#b45309`): Dark amber text on amber backgrounds, or high-contrast amber details.

### Tertiary (Status — Eco Green)

- **Field Green** (`#22c55e`): Status indicators for eco credentials, "active system" badges, success states. Never structural.
- **Field Green Background** (`#dcfce7`): Background tint behind green badge text only.

### Neutral

- **Surface White** (`#ffffff`): Form backgrounds, card surfaces, the right-panel of split layouts.
- **Surface Warm** (`#fbf9f6`): Body background. A barely-there warm off-white — not cream, not paper. Chroma is minimal; warmth comes from the amber accent system, not the background.
- **Ink Primary** (`#0a1428`): All body text on light surfaces. Same value as Navy Midnight; text and background share the same root.
- **Ink Secondary** (`#1e3a6e`): Supporting text, metadata, subdued labels on light surfaces.
- **Ink Muted** (`#64748b`): Placeholder text, helper text, tertiary labels. Never body copy.

### Named Rules

**The Ignition Rule.** Solar amber is used on ≤15% of any given screen. A CTA button, an active nav item, a hover border. Never as a background for full sections or as the dominant color in a layout block. Its rarity is the point — when amber fires, it means "act now."

**The Navy Bedrock Rule.** Navy is not a background color of last resort. It is the brand's primary expression. Use navy full-bleed sections with white type as a deliberate choice, not as decoration. If a section looks like it could be any color, choose navy or white — never the default tinted-neutral gray.

## 3. Typography

**Display Font:** Poppins (700–900 weight), with ui-sans-serif fallback
**Body Font:** Plus Jakarta Sans (400–600 weight), with ui-sans-serif fallback
**Label Font:** Montserrat (500–600 weight) — used for tags, form labels, nav logo

**Character:** Poppins at heavy weight reads like a contractor's stamped plan: assured, legible under any conditions, with a slight geometric stiffness that signals expertise without stuffiness. Plus Jakarta Sans opens it up for reading — it has enough humanist warmth for a local business without being informal. Together they say: "We know what we're doing and we'll take the time to explain it."

### Hierarchy

- **Display** (900 weight, `clamp(2.5rem, 5vw, 5rem)`, line-height 1.05, letter-spacing -0.02em): Hero headlines, section-defining statements. Maximum 1 display element per page section. Text-wrap: balance.
- **Headline** (700 weight, `clamp(1.5rem, 3vw, 2.5rem)`, line-height 1.15, letter-spacing -0.015em): Section headings, feature titles, booking step headings.
- **Title** (600 weight, 1.125rem, line-height 1.4): Card headings, service names, form section labels.
- **Body** (400 weight, 1rem, line-height 1.65): All prose. Maximum line length 65ch. Text-wrap: pretty on long passages.
- **Label** (Montserrat, 600 weight, 0.75rem, letter-spacing 0.08em): Service tags, form labels, nav logo wordmark. Uppercase when used as a status chip; sentence case when inline.

### Named Rules

**The Poppins Weight Rule.** Display and headline headings use 700 or 900 weight only. 400 or 500 weight Poppins reads as unresolved — the font earns its keep when pushed. For body-weight display elements (subtitles, supporting taglines), switch to Plus Jakarta Sans rather than using Poppins at low weight.

**The Tight Heading Floor.** Display letter-spacing floor is -0.02em. Headline floor is -0.015em. Never loosen tracking on heavy display type to "air it out" — that is the opposite of The Sun Contractor's register. Tight tracking is the precision signal.

## 4. Elevation

Shadows are diffuse, ambient, and navy-tinted. They describe depth — a lifted surface, a hovered card — without theatrics. The system is not flat; it uses shadow to confirm interaction and hierarchy. But shadows appear in response to state, not as decoration.

### Shadow Vocabulary

- **Shadow Soft** (`0 2px 16px rgba(15, 31, 64, 0.06)`): Subtle resting state for cards that need slight lift from a white background. The navy tint (`#0f1f40`) in the rgba keeps the shadow from reading as generic gray.
- **Shadow Card** (`0 4px 24px 0 rgb(0 0 0 / 0.06)`): Default elevated surface — service cards at rest, form containers.
- **Shadow Card Hover** (`0 12px 40px 0 rgb(0 0 0 / 0.12)`): Elevated on hover interaction. Double the blur, double the opacity. Never animated suddenly — transitions at 300ms.
- **Shadow Elevated** (`0 16px 48px rgba(15, 31, 64, 0.10)`): Navbar on scroll, dropdown menus, dialogs. Signals a surface that is definitively above the page.
- **Shadow Glow Solar** (`0 8px 32px rgba(245, 158, 11, 0.18)`): Exclusive to solar-amber interactive elements. Primary buttons on hover, active CTAs. The amber glow reinforces the ignition signal without being theatrical.

### Named Rules

**The State-Triggered Shadow Rule.** Surfaces are flat or softly raised at rest. The heavier shadows (`card-hover`, `elevated`) exist only as state responses: hover, active, dialog-open. Never use `shadow-elevated` on a static, non-interactive element.

**The Navy Tint Rule.** Prefer navy-tinted shadow values over pure black. `rgba(15, 31, 64, ...)` instead of `rgba(0, 0, 0, ...)`. This keeps shadows reading as part of the same color system rather than floating, generic darkness.

## 5. Components

### Buttons

A pill system — all variants use `rounded-full`. The shape is consistent across the entire button vocabulary; the differentiation is in fill, border, and color. Buttons have active scale-down (`scale-[0.97]`) for tactile feedback.

- **Shape:** Pill (9999px / `rounded-full`). No exceptions within the Button component system.
- **Primary (Solar):** Solar Ignition background (`#f59e0b`), Navy Deep text (`#0f1f40`), bold weight. Shadow-md at rest, shadow-glow-solar on hover. The brand's primary action signal.
- **Secondary (Navy):** Navy Deep background (`#0f1f40`), white text, bold weight. Shadow-md at rest, shadow-elevated on hover. Used when the action is confirmatory rather than primary CTA.
- **Outline:** Transparent background, `border-2 border-white/30`, white text. Used on dark (navy) backgrounds only — hero sections, split-layout left panels. Backdrop blur for glass effect.
- **Ghost:** No background, no border. Navy Mid text (`#1e3a6e`), hover to solar-500. Tertiary actions, link-level interactions.
- **Sizes:** sm (`px-5 py-2 text-sm`), default/md (`px-7 py-3 text-base`), lg (`px-8 py-4 text-base`). All share the same pill radius.

### Service Link Cards (Booking page)

A distinct pattern from the Button component — flat, sharp-cornered list items for selecting booking service types.

- **Shape:** No border radius (`rounded-none`). Sharp corners communicate the seriousness of a service selection.
- **Background:** White (`#ffffff`).
- **Border:** `border border-slate-200` at rest; `border-solar-300` on hover.
- **Hover:** `hover:-translate-y-1 hover:shadow-lg` — a subtle lift with the border color shift confirming interaction.
- **Index Numbers:** Serif, font-light, 30px, slate-300 — a numbered marker that earns its place because the order actually matters (it IS a sequential list of services).

### Cards / Containers

- **Standard Card:** White bg, card shadow at rest, card-hover shadow on hover. Gently curved corners (`rounded-lg`, 12px).
- **Split Layout:** Navy Midnight left column (30% wide, sticky), white/warm-surface right column. Poppins font-black title at 65px on left. The definitive layout for all booking flows.
- **Dropdown Menu:** White/95 bg, `rounded-2xl` (16px), shadow-elevated, `border border-slate-100/80`, backdrop-blur. Animated with Framer Motion (opacity + scale + y, 0.18s, ease standard).

### Inputs / Fields

- **Style:** White background, 1px border (slate-200 at rest), rounded-md (8px). Internal padding 12px 16px.
- **Focus:** Border shifts to navy-active (`#3b4f8a`); optional focus ring in navy tint. Never solar amber on focus — that's for action, not input state.
- **Placeholder:** Ink Muted (`#64748b`) — this must meet 4.5:1 against the white background. Verify before shipping.
- **Error:** Border red, helper text in red below the field. Never rely on color alone — include an error icon or label prefix.
- **Labels:** Montserrat, 600 weight, 0.75rem, for form section labels. Plus Jakarta Sans, 500 weight, for inline field labels.

### Navigation

- **Transparent mode** (homepage, not scrolled): Transparent background, white/90 link text, white/10 hover backgrounds. Pill-shaped nav links.
- **Scrolled/Opaque mode:** `bg-white/80 backdrop-blur-xl`, navy-900 link text, navy-50 hover backgrounds, solar-500/10 active backgrounds with solar-500 text. Shadow: `0 1px 20px rgba(15, 31, 64, 0.08)`.
- **Active link:** Solar Ignition text (`#f59e0b`), solar-500/10 background pill.
- **Logo:** "JMC" in Montserrat font-black, 2xl, navy-900 (or white when transparent). "SOLAR" in Montserrat medium, 2xl, navy-500 (or white/70 when transparent). Weight contrast within one wordmark is intentional.
- **Mobile:** Hamburger menu. Services expand to a sub-list inline. Booking CTA button preserved.

### Service Tags / Chips

Small status chips used on booking cards and service listings.

- **Shape:** Rounded-full, small padding (4px 10px).
- **Variants:** Solar (solar-600 text, solar-50 bg, solar-100 border), Blue (service type), Emerald (on-site/field). Each variant is intentionally distinct — these chips carry categorical meaning, not decoration.

## 6. Do's and Don'ts

### Do:

- **Do** use solar amber exclusively for CTAs, active states, and interactive signals. Its rarity earns its authority.
- **Do** use Poppins at 700 or 900 weight for all headings. Light-weight Poppins is prohibited.
- **Do** use navy-tinted shadow values (`rgba(15, 31, 64, ...)`) over generic black (`rgba(0,0,0,...)`).
- **Do** keep body text at `#0a1428` (Navy Midnight) on light surfaces. Muted gray body text on near-white fails both contrast and brand register.
- **Do** include `@media (prefers-reduced-motion: reduce)` on every animation — typically a crossfade or instant transition.
- **Do** use the split-layout (navy left / content right) pattern for all booking flows. It is the brand's signature product pattern.
- **Do** maintain 65ch max line length for all body copy.
- **Do** use `text-wrap: balance` on display and headline headings. Overflow is a failure.
- **Do** verify placeholder text contrast at 4.5:1 before shipping any form — shadcn defaults often fail this.

### Don't:

- **Don't** use generic green eco-brand aesthetics: leaf icons as primary decoration, soft sage as a dominant color, nonprofit warmth as the brand register. JMC is a trade business.
- **Don't** use loud solar stock-photo visual language: neon yellow CTAs, clip-art solar panel imagery, discount-heavy typography, star/burst badge shapes.
- **Don't** produce generic AI slop: eyebrow labels on every section, identical card grids with icon + heading + text repeated endlessly, gradient text (`background-clip: text`), hero-metric templates (big number + small label + gradient accent), numbered section markers (`01 / 02 / 03`) on non-sequential content.
- **Don't** use western minimalism that reads as foreign to a Filipino local business: sterile all-white pages with zero warmth, personality-free typography, designs that could belong to any country.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards or callouts. Use background tints or full borders instead.
- **Don't** use the warm-neutral band (`oklch(L 0.84–0.97, C < 0.06, hue 40–100)`) as a body background — cream, sand, paper, parchment reads as the saturated AI default of 2026. `#fbf9f6` is the approved barely-there warm surface; below that chroma level only.
- **Don't** use bounce or elastic easing on any animation. Ease-out only (`ease-out-quart` or `cubic-bezier(0.4, 0, 0.2, 1)`).
- **Don't** nest cards within cards. Booking service selection uses flat list items, not card-in-card grids.
- **Don't** use purple, lavender, or blue-purple anywhere in the UI. The navy-to-indigo range is the navy brand's own hue space; purple drifts into SaaS territory.
