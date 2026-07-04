// Ad-hoc QA verification: inspect an order's paid state + side effects.
// Usage: node scripts/verify-order.mjs <customer-email>
import { readFileSync } from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

function parseEnv(file) {
  const out = {}
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[line.slice(0, eq).trim()] = v
  }
  return out
}

const email = process.argv[2]
if (!email) throw new Error('pass a customer email')

const env = parseEnv(path.join(process.cwd(), '.env.local'))
const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
const app = admin.initializeApp({ credential: admin.credential.cert(sa) }, 'verify-order')
const db = app.firestore()

const snap = await db.collection('orders').where('customer.email', '==', email).get()
const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
if (!orders.length) { console.log('NO ORDER for', email); process.exit(0) }
const o = orders[0]
console.log('ORDER', o.id)
console.log('  payment_status:', o.payment_status, '| status:', o.status, '| paid_at:', o.paid_at)
console.log('  payment_reference:', o.payment_reference, '| source:', o.source)
console.log('  subtotal/shipping/total:', o.subtotal_centavos, o.shipping_centavos, o.total_centavos)
for (const it of o.items) console.log('   item', it.shop_item_id, 'variant', it.variant_id, 'qty', it.quantity)

// stockAudit rows for this order
const audit = await db.collection('stockAudit').where('ref_id', '==', o.id).get()
console.log('  stockAudit rows:', audit.size)
audit.docs.forEach((d) => { const a = d.data(); console.log('    ', a.shop_item_id, 'reason', a.reason, 'delta', a.delta, 'stock_after', a.stock_after) })

// current stock of each item
for (const it of o.items) {
  const s = await db.collection('shopItems').doc(it.shop_item_id).get()
  const d = s.data()
  if (it.variant_id) { const v = (d.variants || []).find((x) => x.id === it.variant_id); console.log('  stock', it.shop_item_id, '/', it.variant_id, '=', v && v.stock) }
  else console.log('  stock', it.shop_item_id, '=', d && d.stock)
}

// abandonedCarts recovered flag
const carts = await db.collection('abandonedCarts').where('email', '==', email).get()
console.log('  abandonedCarts:', carts.size, '| recovered:', carts.docs.map((d) => d.data().recovered))

await app.delete()
