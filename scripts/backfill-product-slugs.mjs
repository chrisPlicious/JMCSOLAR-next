// One-time backfill: give every `products` doc a unique `slug` for its
// /products/[slug] detail page. New products get a slug on create
// (app/admin/products/actions.ts); this fills docs created before that change.
//
// Reads FIREBASE_SERVICE_ACCOUNT_JSON from .env.local (same pattern as
// seed-dev.mjs / set-cache-control.mjs). Safe to re-run — skips docs that
// already have a slug. Run against EACH environment (dev + prod) whose
// Firestore backs the site.
//
// Usage: node scripts/backfill-product-slugs.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

function parseEnv(file) {
  const out = {}
  const text = readFileSync(file, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

// Keep in sync with lib/seo/slug.ts
function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const env = parseEnv(path.resolve('.env.local'))
const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const snap = await db.collection('products').get()
console.log(`${snap.size} products found`)

// Seed the used-set with slugs that already exist so we never collide.
const used = new Set()
for (const doc of snap.docs) {
  const s = doc.data().slug
  if (s) used.add(s)
}

let updated = 0
let skipped = 0
for (const doc of snap.docs) {
  const data = doc.data()
  if (data.slug) {
    skipped++
    continue
  }
  let base = slugify(data.name) || 'product'
  let slug = base
  let n = 2
  while (used.has(slug)) {
    slug = `${base}-${n++}`
  }
  used.add(slug)
  await doc.ref.update({ slug })
  updated++
  console.log(`set ${doc.id} -> ${slug}`)
}
console.log(`done: ${updated} updated, ${skipped} already had a slug`)
