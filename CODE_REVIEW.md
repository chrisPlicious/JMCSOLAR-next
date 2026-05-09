# Code Review — jmc-next

**Date:** 2026-05-07
**Reviewer:** Claude (Opus 4.7)
**Scope:** Full repo. Production readiness, bug hunt, security audit.
**Target deploy:** Vercel
**Branch:** `birchtree`

---

## TL;DR

**Verdict: NOT production-ready until CRITICAL items fixed.**

- **3 critical** secret-handling problems must be fixed before merge.
- **6 high** issues affect security posture or will cause user-visible bugs in production.
- **9 medium** issues weaken hardening or risk minor data quality problems.
- **6 low** items are polish.

The architecture is sound: server-only Firebase Admin SDK, HMAC-signed sessions in middleware, Upstash rate limiting, magic-byte upload validation, denial-by-default Firestore/Storage rules. The execution leaks at the edges — secrets in repo, no login throttling, public Firestore reads of unmoderated data, oversized server-action body limit.

---

## CRITICAL — fix before deploy

### C1. `.env.local` contains live production secrets in plaintext on disk

**File:** `.env.local`

Visible secrets (already exposed to me in this review session):

```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_rLCBH4rSssZ8cIIb0iUMIg_aTI9ES2J
ADMIN_PASSWORD=JMCWEBadmin123
SESSION_SECRET=5a7c1c40e5d2def8c12330b018bf915fbb05feaee0848d5ff91effd08259800d
FIREBASE_SERVICE_ACCOUNT_JSON={...full private key...}
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBnJsPKACmmvmARNu1UOzOXTMNnGF2d8L4
```

`.gitignore` does exclude `.env*` so the file should not be in git history — **verify with `git log --all --full-history -- .env.local`**. If it was ever committed, every secret above is compromised.

Required actions:
1. Verify `.env.local` was never committed.
2. **Rotate every secret** anyway (Supabase service role, Firebase service account private key, ADMIN_PASSWORD, SESSION_SECRET) — this file was opened by tooling and the values now live in many caches.
3. Move `ADMIN_PASSWORD` off plaintext entirely → store a bcrypt/argon2 hash, compare with `bcrypt.compare`. Current weak password `JMCWEBadmin123` also breaks any reasonable password policy.
4. Set Vercel env vars via dashboard, not via committed files. Mark sensitive vars as Encrypted.

### C2. No rate limit / lockout on admin login

**File:** `app/admin/login/actions.ts`

`loginAction` does an equality check against `ADMIN_PASSWORD` with no rate limit, no lockout, no IP throttle. Anyone can hammer `/admin/login` at network speed and brute-force the password. Combined with the weak password (C1) this is a 30-second compromise.

```ts
if (!password || password !== process.env.ADMIN_PASSWORD) {
  redirect('/admin/login?error=1');
}
```

Fix: wrap in `rateLimit(getClientIp(...), 5, 15*60*1000)` keyed by IP, return 429 on burn. Also use `crypto.timingSafeEqual` for the password compare to prevent timing attacks.

### C3. Storage bucket is fully public + predictable paths

**Files:** `lib/firebase/storage.ts:13`, `app/admin/products/actions.ts:18`, `app/admin/projects/actions.ts:60`

```ts
await file.save(buffer, { contentType, public: true });
return `https://storage.googleapis.com/${BUCKET}/${path}`;
```

Paths are `product-images/<uuid>/product-<Date.now()>.<ext>` and `project-images/<uuid>/img-<ts>-<i>.<ext>`. Once a UUID leaks (via DOM source, share link, etc.), the entire image set is enumerable. There is no signed URL TTL, no auth check, no revocation path.

For a marketing site where images **are** meant to be public, this is acceptable — but combined with `storage.rules` `allow read: if true` you have **no** ability to ever take an image private. Acknowledge as a deliberate trade-off, or switch to signed URLs (`getSignedUrl({ expires: ... })`).

---

## HIGH

### H1. Public Firestore client can read pending/rejected reviews

**Files:** `firestore.rules:24`, `page-components/home/Reviews.tsx:28`, `app/api/reviews/route.ts:69`

Rules:
```
match /reviews/{docId} {
  allow read: if true;
  allow write: if false;
}
```

Public review submissions land as `status: 'pending'` (correct), but Firestore rules cannot filter by field — any client can issue `getDocs(collection(db,'reviews'))` and read every pending review including the SHA-256 `contact_value` hash, reviewer name, quote, and rating before moderation. Hash blocks plaintext recovery, but unmoderated content (PII names + comment text) is exposed.

Fix: either (a) move public read to a server route that filters `status==approved`, drop client-side Firebase, and tighten rule to `allow read: if false`, or (b) use Firestore data validation rules + a separate `reviewsPublic` collection that only contains approved review safe-fields.

### H2. Server action body size limit 50 MB → DoS surface

**File:** `next.config.ts:24`

```ts
serverActions: { bodySizeLimit: '50mb' }
```

Each admin action call can ingest 50 MB. There is no per-IP rate limit on server actions (auth-only). A logged-in attacker (or stolen session) can exhaust function memory/time on Vercel. 10 MB matches your image upload validator (`MAX_FILE_SIZE = 10 MB`) — set the body limit to ~12 MB and rely on upload validation for per-file caps.

### H3. Reviews API uses unkeyed `crypto.randomUUID()` and stores hash with no salt

**File:** `app/api/reviews/route.ts:55,71`

```ts
contact_value: createHash('sha256').update(contact_value).digest('hex')
```

SHA-256 of an email/phone is trivially reversible by lookup table — there are only ~10⁹ Philippine mobile numbers. Use HMAC with a server-side pepper (`crypto.createHmac('sha256', process.env.CONTACT_PEPPER)`) so leaked DB rows can't be re-identified offline.

Also: `crypto.randomUUID()` works on Vercel Node 20+, but reading `crypto` as a global without `import { randomUUID } from 'crypto'` relies on Node 19+. Verify `engines.node` in `package.json` (currently absent) — pin `"engines": { "node": ">=20" }` to be safe.

### H4. Login & admin redirects ignore the `next` param → infinite/broken loop after auth expiry

**File:** `middleware.ts:64`

When session expires mid-action, middleware redirects `/admin/foo` → `/admin/login`, but the login form on success always redirects to `/admin`. User loses context. Worse, if a server-action redirect to `/admin` runs while Firebase Admin init throws, error boundary loops back. Capture intended path:

```ts
const url = new URL('/admin/login', request.url);
url.searchParams.set('next', request.nextUrl.pathname);
return NextResponse.redirect(url);
```

Then `loginAction` reads `next` and validates it starts with `/admin/`.

### H5. No CSP header

**File:** `next.config.ts:5`

You set HSTS, X-Frame-Options, nosniff, Permissions-Policy — all good — but no `Content-Security-Policy`. The home page injects raw JSON-LD via `dangerouslySetInnerHTML` (`app/page.tsx:46`), Firebase loads inline scripts, framer-motion does inline styles. A pragmatic starting CSP:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.firebaseio.com https://*.googleapis.com;
  img-src 'self' data: https://storage.googleapis.com https://firebasestorage.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;
  frame-ancestors 'none';
```

Tune via report-only mode first.

### H6. `Reviews.tsx` client-side Firestore call has no error handling

**File:** `page-components/home/Reviews.tsx:28-32`

```ts
getDocs(q).then((snap) => { setReviews(...); });
```

No `.catch`. If Firestore rules ever tighten or the network drops, the home page silently shows an empty reviews section forever (no skeleton, no error toast, no retry). At minimum add `.catch(console.error)` and a fallback UI.

Also: `Reviews` is a `'use client'` component using the Firebase **client** SDK on the marketing home page — that ships ~80 KB of Firebase JS to every visitor. Switch to a server component that calls `adminDb` and passes data as props (matches the pattern already in `app/projects/page.tsx`).

---

## MEDIUM

### M1. Middleware token check uses `parseInt(iatHex, 16)` with no overflow guard

**File:** `middleware.ts:23`, `lib/auth.ts:36`

`Date.now()` in hex is 11 chars today and grows ~1 char per ~600 years. A malicious token with a giant hex string would still fall to the `Date.now() - iat > TTL` check (overflow → negative → `>TTL` true), so it's safe — but you should explicitly cap `iatHex.length <= 16` to be defensive.

### M2. Server action error messages leak internals

**Files:** `app/admin/projects/actions.ts:88`, `app/admin/services/actions.ts:117`, etc.

```ts
return { error: e instanceof Error ? e.message : 'Unknown error' };
```

Firestore errors include collection paths, sometimes index URLs. Admin-only path so blast radius is small, but: log the full error server-side, return a generic `Failed to save project` to the client.

### M3. `crypto.randomUUID()` used as document IDs throughout — no collision checks

Acceptable (UUIDv4 collision odds are negligible) but `adminDb.doc(id).set(...)` overwrites if a collision happens. Use `.create(...)` to fail loudly instead — costs nothing.

### M4. Firestore full-collection scans on admin dashboard

**File:** `app/admin/page.tsx`

```ts
adminDb.collection('reviews').get(),
```

Loads every review document on every dashboard load. With `dynamic = 'force-dynamic'` this hits Firestore on every request. Use `.count().get()` (which you already do for the other 3) and a `limit(5)` query for "recent reviews".

### M5. Sitemap silently swallows Firestore errors

**File:** `app/sitemap.ts:22`

```ts
} catch { /* Firestore unavailable at build time */ }
```

If Firestore is permanently down at build, the sitemap will be missing service pages and you won't notice. Log the error.

### M6. `cover_image_path` field is sometimes a storage path, sometimes a public URL

**File:** `app/admin/projects/actions.ts:80,219`, `app/projects/page.tsx:49`

`createProjectAction` writes `cover_image_path` as the **storage path** (`project-images/<id>/img-...jpg`), then `app/projects/page.tsx` runs `getPublicUrl(...)` on it — fine. But `setCoverAction` also stores the storage path. Double-check no admin code writes the full URL anywhere; if it does, `getPublicUrl` will produce `https://storage.googleapis.com/bucket/https://storage.googleapis.com/...`. Add a guard in `getPublicUrl` to detect already-prefixed URLs.

### M7. `ProjectCard` uses raw `<img>` not `next/image`

**File:** `components/ui/ProjectCard.tsx`

```tsx
<img src={project.cover_image_path} alt={project.title} ... />
```

Loses Vercel image optimization, blocks LCP. The `images.remotePatterns` in `next.config.ts` already whitelists Firebase storage — switch to `<Image>`.

### M8. Drag-drop uploader uses `DataTransfer` constructor without SSR guard

**File:** `app/admin/projects/_components/DragDropImageUploader.tsx:13`

```ts
useEffect(() => {
  const dt = new DataTransfer();
  ...
}, [files]);
```

Inside `useEffect` so SSR-safe, but on Safari/older browsers `DataTransfer()` throws. Wrap in try/catch and fall back to plain `<input>` selection.

### M9. `transpilePackages: ['framer-motion']` is unnecessary on Next 16

**File:** `next.config.ts:28`

Framer Motion ships ESM since v11+; transpiling adds build time. Remove unless you hit a specific build error.

---

## LOW

### L1. Suspense boundary around `Contact` is empty

**File:** `page-components/home/HomePage.tsx:13`

`<Suspense>` with no `fallback` prop renders nothing during server render. Add `fallback={<ContactSkeleton />}` or remove the boundary.

### L2. `eslint.config.mjs` extends only `next/core-web-vitals` and `next/typescript`

No `eslint-plugin-security`, no `@typescript-eslint/no-floating-promises`. You have several `.catch((err) => console.error)` patterns where awaiting would be cleaner.

### L3. `TOKEN_TTL_MS` constant duplicated in `middleware.ts` and `lib/auth.ts`

Single source of truth: export from `lib/auth.ts`. Edge runtime can't import Node `crypto` so middleware must keep its own `verifyToken`, but the constants can be shared.

### L4. Unused / leftover files in repo root

`proxy.ts` (deleted in current diff — good). `.code-review-graph/` and `graphify-out/` are gitignored but bloat local directory. `.env.example` is missing — add one for onboarding.

### L5. `package.json` has no `"engines"` field

Pin Node version: `"engines": { "node": ">=20.x" }`. Vercel respects this.

### L6. Test coverage gaps

Tests exist for: `auth`, `form-data`, `get-client-ip`, `rate-limit`, `solar-calculator`, `upload-validation`. **No tests** for: any server action (zero coverage of the most security-sensitive code), API routes, middleware. Add at minimum:
- `middleware.ts` token verification round-trip
- `app/api/reviews/route.ts` validation rejection paths
- One `requireAdminAuth` integration per action file

---

## What's Good (keep doing)

- Lazy-init Firebase Admin via `Proxy` — avoids build-time crash. Solid pattern.
- HMAC-signed sessions with constant-time compare in both Node and Edge runtime.
- Magic-byte file validation (`lib/upload-validation.ts`) — beats MIME-only.
- Default-deny Firestore + Storage rules with explicit allowlists.
- Server actions all start with `await requireAdminAuth()` (verified across 4 action files, 14 call sites).
- Input length truncation in API routes (`.slice(0, 200)`).
- Rate limiting on both public POST endpoints (contact, reviews).
- 24h session TTL (down from 7d per the comment) — good default.
- `httpOnly`, `secure`, `sameSite=strict` cookies.

---

## Pre-Deploy Checklist

- [ ] **C1**: Rotate ALL secrets. Verify no `.env.local` in git history.
- [ ] **C1**: Replace plaintext `ADMIN_PASSWORD` with hashed compare.
- [ ] **C2**: Add login rate limit (5 attempts / 15 min / IP).
- [ ] **C3**: Decide signed URLs vs accept-public; document decision.
- [ ] **H1**: Either move public reviews fetch server-side or accept exposure of pending review fields.
- [ ] **H2**: Drop `bodySizeLimit` to 12 MB.
- [ ] **H3**: Pepper the contact_value hash. Pin `engines.node`.
- [ ] **H4**: Add `next` param round-trip in middleware/login.
- [ ] **H5**: Add CSP (start in report-only).
- [ ] **H6**: Add `.catch` + fallback UI to client `Reviews` fetch.
- [ ] Set Vercel env vars via dashboard (mark sensitive as Encrypted).
- [ ] Set Vercel function timeout for `/api/contact` and `/api/reviews` (default 10s is enough; Hobby tier caps at 10s anyway — confirm Pro if needed for SMTP retries).
- [ ] Configure Vercel `regions` to a Singapore/HK region for PH latency.
- [ ] Run `npm run build` and `npm run typecheck` in CI before merge.
- [ ] Smoke-test: login → create project → upload 5 images → delete project → verify storage cleanup.
