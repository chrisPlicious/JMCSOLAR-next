import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// trim() strips a stray BOM (U+FEFF) or whitespace that can be pasted into the env
// values in a dashboard. A BOM in projectId/apiKey silently breaks every browser
// Firestore read (e.g. the /services and products listings). The .trim() runs in
// the browser on the build-inlined literal, so it cleans the value even post-build.
const clean = (v: string | undefined) => (v ?? '').trim()

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
}

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db: Firestore = getFirestore(firebaseApp)
export const storage: FirebaseStorage = getStorage(firebaseApp)
