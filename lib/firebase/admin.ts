import * as admin from 'firebase-admin'

const APP_NAME = 'jmc-admin'

/**
 * Loads the service account from FIREBASE_SERVICE_ACCOUNT_JSON.
 * Accepts either raw JSON or base64-encoded JSON — base64 is preferred for
 * dashboards (e.g. Vercel) because pasting raw multi-line JSON often mangles the
 * private_key newlines, producing "SyntaxError: Unexpected token" at runtime.
 */
function loadServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')

  const trimmed = raw.trim()
  // Anything not starting with "{" is treated as base64-encoded JSON.
  const jsonStr = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8')

  let parsed: admin.ServiceAccount & { private_key?: string }
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON (${(e as Error).message}). ` +
        `Set it to the raw service-account JSON or its base64 encoding, and make sure the ` +
        `private_key newlines stay escaped as \\n.`,
    )
  }

  // Guard against the private_key arriving double-escaped (literal "\n" left in the
  // string); credential.cert needs real newlines in the PEM.
  if (parsed.private_key && parsed.private_key.includes('\\n')) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }
  return parsed
}

function getAdminApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === APP_NAME)
  if (existing) return existing

  return admin.initializeApp(
    {
      credential: admin.credential.cert(loadServiceAccount()),
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
