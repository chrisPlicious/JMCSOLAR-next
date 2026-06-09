// One-time seed: copy Firestore documents + Storage objects from PROD -> DEV.
//
// Reads PROD service account from .env.local (FIREBASE_SERVICE_ACCOUNT_JSON) and
// DEV service account from the path in DEV_SERVICE_ACCOUNT_PATH (a downloaded key file).
// Preserves Firestore document IDs. Copies Storage objects under known prefixes.
//
// Usage (PowerShell):
//   $env:DEV_SERVICE_ACCOUNT_PATH="C:\path\to\dev-adminsdk.json"; node scripts/seed-dev.mjs
//
// Safe to re-run: it overwrites dev docs/objects with the current prod copy.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

const COLLECTIONS = [
  'services',
  'serviceDetails',
  'projects',
  'projectImages',
  'products',
  'reviews',
  'contactSubmissions',
  'results',
]

const STORAGE_PREFIXES = ['product-images/', 'project-images/']

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

function initApp(name, serviceAccount, storageBucket) {
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    },
    name,
  )
}

async function copyFirestore(srcDb, destDb) {
  for (const col of COLLECTIONS) {
    const snap = await srcDb.collection(col).get()
    if (snap.empty) {
      console.log(`  ${col}: 0 docs (skip)`)
      continue
    }
    let batch = destDb.batch()
    let n = 0
    for (const doc of snap.docs) {
      batch.set(destDb.collection(col).doc(doc.id), doc.data())
      n++
      if (n % 400 === 0) {
        await batch.commit()
        batch = destDb.batch()
      }
    }
    await batch.commit()
    console.log(`  ${col}: ${snap.size} docs copied`)
  }
}

async function copyStorage(srcBucket, destBucket) {
  for (const prefix of STORAGE_PREFIXES) {
    const [files] = await srcBucket.getFiles({ prefix })
    let n = 0
    for (const file of files) {
      if (file.name.endsWith('/')) continue
      const [buf] = await file.download()
      const [meta] = await file.getMetadata()
      await destBucket.file(file.name).save(buf, {
        contentType: meta.contentType,
        resumable: false,
        metadata: { metadata: meta.metadata || {} },
      })
      n++
    }
    console.log(`  ${prefix}: ${n} objects copied`)
  }
}

async function main() {
  const root = process.cwd()
  const env = parseEnv(path.join(root, '.env.local'))

  const prodSaRaw = env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!prodSaRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON missing in .env.local (need PROD creds before swapping)')
  const prodSa = JSON.parse(prodSaRaw)
  const prodBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!prodBucket) throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing in .env.local')

  const devSaPath = process.env.DEV_SERVICE_ACCOUNT_PATH
  if (!devSaPath) throw new Error('Set DEV_SERVICE_ACCOUNT_PATH to the downloaded dev service-account JSON')
  const devSa = JSON.parse(readFileSync(devSaPath, 'utf8'))
  const devBucket = `${devSa.project_id}.firebasestorage.app`

  if (prodSa.project_id === devSa.project_id) {
    throw new Error(`Refusing to seed: prod and dev project_id are identical (${prodSa.project_id})`)
  }

  console.log(`PROD ${prodSa.project_id} (${prodBucket})  ->  DEV ${devSa.project_id} (${devBucket})`)

  const prodApp = initApp('seed-prod', prodSa, prodBucket)
  const devApp = initApp('seed-dev', devSa, devBucket)

  console.log('Firestore:')
  await copyFirestore(prodApp.firestore(), devApp.firestore())

  console.log('Storage:')
  await copyStorage(prodApp.storage().bucket(), devApp.storage().bucket())

  console.log('Done.')
  await Promise.all([prodApp.delete(), devApp.delete()])
}

main().catch((e) => {
  console.error('SEED FAILED:', e.message)
  process.exit(1)
})
