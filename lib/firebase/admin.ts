import * as admin from 'firebase-admin'

const APP_NAME = 'jmc-admin'

function getAdminApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === APP_NAME)
  if (existing) return existing

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')

  return admin.initializeApp(
    {
      credential: admin.credential.cert(JSON.parse(json) as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    APP_NAME,
  )
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
