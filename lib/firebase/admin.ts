import * as admin from 'firebase-admin'

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')
  const serviceAccount = JSON.parse(json) as admin.ServiceAccount
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

// Lazy proxies — Firebase Admin initializes only on the first request, not at build time
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop: string | symbol) {
    return (admin.firestore(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_, prop: string | symbol) {
    return (admin.storage(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop]
  },
})
