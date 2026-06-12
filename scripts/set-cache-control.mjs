// One-time backfill: set Cache-Control metadata on existing Storage objects.
//
// New uploads get this automatically (lib/firebase/storage.ts); this fixes
// objects uploaded before that change. Without it Firebase serves
// `private, max-age=0` and every page view re-downloads the original.
//
// Reads FIREBASE_SERVICE_ACCOUNT_JSON + NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// from .env.local (same pattern as seed-dev.mjs). Safe to re-run.
//
// Usage: node scripts/set-cache-control.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

const CACHE_CONTROL = 'public, max-age=2592000, immutable'

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

const env = parseEnv(path.resolve('.env.local'))
const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
const bucketName = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
})

const [files] = await admin.storage().bucket(bucketName).getFiles()
console.log(`${files.length} objects in ${bucketName}`)

let updated = 0
let skipped = 0
for (const file of files) {
  if (file.metadata.cacheControl === CACHE_CONTROL) {
    skipped++
    continue
  }
  await file.setMetadata({ cacheControl: CACHE_CONTROL })
  updated++
  console.log(`set ${file.name}`)
}
console.log(`done: ${updated} updated, ${skipped} already set`)
