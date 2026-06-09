// One-time: point local .env.local at the DEV Firebase project.
// - Backs up the current (PROD) Firebase lines to .env.prod.backup
// - Replaces the 7 Firebase keys with DEV values
// - Leaves all other vars (SESSION_SECRET, ADMIN_PASSWORD, ZOHO_*, UPSTASH_*, etc.) untouched
// Secrets are never printed.
//
//   $env:DEV_SERVICE_ACCOUNT_PATH="C:\path\to\dev-adminsdk.json"; node scripts/swap-env-to-dev.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const DEV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyBoaIDFS-S-RD9z3VCewEDJ328U4u2YPDQ',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'jmc-web-dev.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'jmc-web-dev',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'jmc-web-dev.firebasestorage.app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '268738515256',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:268738515256:web:acdf0c0cbeb9dac47771cd',
}

const SA_KEY = 'FIREBASE_SERVICE_ACCOUNT_JSON'
const MANAGED = [...Object.keys(DEV), SA_KEY]

const root = process.cwd()
const envPath = path.join(root, '.env.local')
const backupPath = path.join(root, '.env.prod.backup')

if (!existsSync(envPath)) throw new Error('.env.local not found')

const devSaPath = process.env.DEV_SERVICE_ACCOUNT_PATH
if (!devSaPath) throw new Error('Set DEV_SERVICE_ACCOUNT_PATH to the dev service-account JSON')
const devSaCompact = JSON.stringify(JSON.parse(readFileSync(devSaPath, 'utf8')))

const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)

// 1. Back up current PROD lines for the managed keys
const backup = ['# PROD Firebase values backed up before dev swap', `# ${new Date().toISOString()}`]
for (const line of lines) {
  const key = line.slice(0, line.indexOf('=')).trim()
  if (MANAGED.includes(key)) backup.push(line)
}
if (!existsSync(backupPath)) {
  writeFileSync(backupPath, backup.join('\n') + '\n')
  console.log(`Backed up ${backup.length - 2} prod Firebase lines -> .env.prod.backup`)
} else {
  console.log('.env.prod.backup already exists — leaving it as-is')
}

// 2. Replace managed keys in place; track which were seen
const seen = new Set()
const newValue = (key) => (key === SA_KEY ? devSaCompact : DEV[key])
const out = lines.map((line) => {
  const key = line.slice(0, line.indexOf('=')).trim()
  if (MANAGED.includes(key)) {
    seen.add(key)
    return `${key}=${newValue(key)}`
  }
  return line
})

// 3. Append any managed key that was missing
for (const key of MANAGED) {
  if (!seen.has(key)) out.push(`${key}=${newValue(key)}`)
}

writeFileSync(envPath, out.join('\n'))
console.log('Swapped .env.local Firebase keys -> DEV:')
for (const key of MANAGED) console.log(`  ${key}`)
console.log('Done. Restart `npm run dev` to pick up changes.')
