# Homepage redesign — two standalone options

Two self-contained HTML pages that reuse the real photos and logos in `public/`.
Open either file directly in a browser (double-click), or preview through a tiny static server:

```bash
node redesign/_serve.mjs
```

then visit `http://localhost:8787/redesign/`.

| File | Direction | One-line thesis |
|---|---|---|
| `option-1-engineered.html` | Engineer's drawing set (brief-pinned: electrical engineering, warm) | The page is a licensed engineer's as-built drawing set for your own roof. Signature piece: an interactive single-line diagram that runs a hybrid system through a day, with a "grid outage" switch. |
| `option-2-daylight.html` | Architect's daylight section | The page is one day in a solar home in Leyte. Scroll moves the sun across a section drawing of a bungalow; rooms light up, the battery carries the evening, the street goes dark at 22:05 and the house does not. |

## What both share

- Real content only: current site copy, the seven real Facebook/Google reviews, the 19 service-area cities, real contact details, real project photos.
- Working pieces: bill-to-system estimate (assumptions stated inline), site-assessment form with validation (prototype: shows a "received" state, not wired to the booking flow), mobile menu, smooth scroll (Lenis) and scroll-driven motion (GSAP ScrollTrigger) loaded from CDN, with a no-JS / reduced-motion fallback that keeps everything visible.
- Fonts from Google Fonts: Archivo + Chivo Mono (option 1); Familjen Grotesk + Azeret Mono (option 2). Internet required for fonts and the two motion libraries; images are local.

## Things to verify before any of this ships

- Project captions were written from the photo file names (`100kwp`, `24kw`, `6kw`, `15k`, `shell`…) and the projects list on the live site. Confirm kW figures, categories and locations against the real project records.
- "12 modules" annotations on the hero photo were counted from the image.
- The estimate uses ₱14.50/kWh, 4.5 peak sun hours, 80% performance ratio, 80% / 90% offset. Adjust to your real assumptions.
- Facebook links point at facebook.com; replace with the page URL.

## Housekeeping

- `_serve.mjs` is only a preview helper.
- `.claude/launch.json` got a `redesign-static` entry so the in-app browser can preview these files.
- `DESIGN.md` still describes the old visual system; it should be rewritten from whichever option is chosen.
