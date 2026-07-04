// Seed the `shopItems` collection with mock light items for dev/testing.
//
// Writes to the Firebase project whose service account is in .env.local
// (FIREBASE_SERVICE_ACCOUNT_JSON). Locally that is the DEV project (jmc-web-dev)
// per the dev/prod split — confirm before running against prod creds.
//
// Usage (PowerShell):
//   node scripts/seed-shop-items.mjs
//
// Idempotent: documents use deterministic ids derived from their slug, so a
// re-run upserts (overwrites) the same items instead of duplicating them.

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

// Local image bundled with the repo, uploaded once and shared by every seed item.
const SEED_IMAGE_LOCAL = 'scripts/seed-assets/seed-shop.jpg'
const SEED_IMAGE_PATH = 'shop-item-images/seed/seed-shop.jpg'
const IMMUTABLE_CACHE = 'public, max-age=2592000, immutable'

// --- tiny .env parser (handles KEY=value, optional surrounding quotes) ---
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

function slugify(raw) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const NOW = new Date().toISOString()

// Prices/stock in centavos (₱500 = 50000). Mock catalog of small light items.
function item({ name, category, sku, price, stock, lowStockThreshold = null, weightGrams = null, variants = null, description = '' }) {
  const slug = slugify(name)
  return {
    id: slug,
    name,
    slug,
    description,
    category,
    sku,
    price,
    stock,
    low_stock_threshold: lowStockThreshold,
    active: true,
    weight_grams: weightGrams,
    image_path: null,
    variants,
    meta_title: null,
    meta_description: null,
    created_at: NOW,
    updated_at: NOW,
  }
}

const SHOP_ITEMS = [
  item({
    name: 'Solar Garden Light',
    category: 'lights',
    sku: 'LGT-GARDEN-01',
    price: 49900, // ₱499
    stock: 40,
    weightGrams: 350,
    description: 'Weatherproof solar-powered garden pathway light with auto dusk-to-dawn sensor.',
  }),
  item({
    name: 'Solar Flood Light',
    category: 'lights',
    sku: 'LGT-FLOOD',
    price: 89900, // base; overridden per variant
    stock: 0, // has variants, so base stock is ignored
    lowStockThreshold: 4,
    weightGrams: 900,
    description: 'High-lumen solar flood light with remote control. Available in multiple wattages.',
    variants: [
      { id: 'flood-60w', label: '60W', sku: 'LGT-FLOOD-60', price_centavos: 89900, stock: 25 },
      { id: 'flood-100w', label: '100W', sku: 'LGT-FLOOD-100', price_centavos: 129900, stock: 18 },
      { id: 'flood-200w', label: '200W', sku: 'LGT-FLOOD-200', price_centavos: 199900, stock: 3 },
    ],
  }),
  item({
    name: 'Solar String Lights',
    category: 'lights',
    sku: 'LGT-STRING',
    price: 39900,
    stock: 60,
    weightGrams: 250,
    description: 'Decorative solar fairy string lights, warm white, 10 meters.',
    variants: [
      { id: 'string-warm', label: 'Warm White', sku: 'LGT-STRING-WW', price_centavos: 39900, stock: 35 },
      { id: 'string-rgb', label: 'RGB Color', sku: 'LGT-STRING-RGB', price_centavos: 49900, stock: 22 },
    ],
  }),
  item({
    name: 'Solar Motion Light',
    category: 'lights',
    sku: 'LGT-MOTION-01',
    price: 64900,
    stock: 28,
    weightGrams: 400,
    description: 'PIR motion-sensing solar wall light for outdoor security.',
  }),
  item({
    name: 'PV Wire 4mm² (per meter)',
    category: 'wires',
    sku: 'WIRE-PV-4MM',
    price: 8500,
    stock: 500,
    lowStockThreshold: 50,
    weightGrams: 60,
    description: 'UV-resistant single-core solar PV cable, 4mm², sold per meter.',
  }),
  item({
    name: 'PV Wire 6mm² (per meter)',
    category: 'wires',
    sku: 'WIRE-PV-6MM',
    price: 12500,
    stock: 320,
    lowStockThreshold: 50,
    weightGrams: 85,
    description: 'UV-resistant single-core solar PV cable, 6mm², sold per meter.',
  }),
  item({
    name: 'MC4 Connector Pair',
    category: 'accessories',
    sku: 'ACC-MC4-PAIR',
    price: 9900,
    stock: 200,
    weightGrams: 40,
    description: 'Waterproof MC4 male + female connector pair for solar panel wiring.',
  }),
  item({
    name: 'Cable Ties (100 pack)',
    category: 'accessories',
    sku: 'ACC-TIES-100',
    price: 14900,
    stock: 8,
    lowStockThreshold: 10,
    weightGrams: 300,
    description: 'UV-stabilized nylon cable ties, 300mm, 100 pieces per pack.',
  }),
]

async function main() {
  const root = process.cwd()
  const env = parseEnv(path.join(root, '.env.local'))

  const saRaw = env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON missing in .env.local')
  const sa = JSON.parse(saRaw)

  const bucketName = (env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim()
  if (!bucketName) throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing in .env.local')

  const localAsset = path.join(root, SEED_IMAGE_LOCAL)
  if (!existsSync(localAsset)) throw new Error(`Seed image not found at ${SEED_IMAGE_LOCAL}`)

  console.log(`Seeding shopItems into project: ${sa.project_id}`)

  const app = admin.initializeApp(
    { credential: admin.credential.cert(sa), storageBucket: bucketName },
    'seed-shop-items',
  )
  const db = app.firestore()

  // Upload the shared seed image once. The shop-item-images/ prefix is public-read
  // via storage.rules, so getPublicUrl() resolves it on the storefront.
  await app.storage().bucket().upload(localAsset, {
    destination: SEED_IMAGE_PATH,
    metadata: { contentType: 'image/jpeg', cacheControl: IMMUTABLE_CACHE },
    public: true,
  })
  console.log(`  uploaded seed image -> ${SEED_IMAGE_PATH}`)

  let batch = db.batch()
  let n = 0
  for (const it of SHOP_ITEMS) {
    batch.set(db.collection('shopItems').doc(it.id), { ...it, image_path: SEED_IMAGE_PATH })
    n++
    if (n % 400 === 0) {
      await batch.commit()
      batch = db.batch()
    }
  }
  await batch.commit()

  console.log(`  shopItems: ${SHOP_ITEMS.length} items seeded (image set)`)
  console.log('Done.')
  await app.delete()
}

main().catch((e) => {
  console.error('SEED FAILED:', e.message)
  process.exit(1)
})
