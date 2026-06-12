import { adminStorage } from './admin'

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

// New-generation buckets (*.firebasestorage.app) require the v0 REST URL.
// Legacy buckets (*.appspot.com) use the storage.googleapis.com CDN URL.
function buildStorageUrl(storagePath: string): string {
  if (BUCKET.endsWith('.firebasestorage.app')) {
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`
  }
  return `https://storage.googleapis.com/${BUCKET}/${storagePath}`
}

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = adminStorage.bucket(BUCKET)
  const file = bucket.file(path)
  await file.save(buffer, { contentType, public: true })
  return buildStorageUrl(path)
}

export function getPublicUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Rewrite legacy storage.googleapis.com URLs for .firebasestorage.app buckets —
    // those buckets 404 on the CDN URL; they need the v0 REST URL.
    if (
      BUCKET.endsWith('.firebasestorage.app') &&
      path.startsWith(`https://storage.googleapis.com/${BUCKET}/`)
    ) {
      const storagePath = path.slice(`https://storage.googleapis.com/${BUCKET}/`.length)
      return buildStorageUrl(storagePath)
    }
    return path
  }
  return buildStorageUrl(path)
}

export async function deleteFile(path: string): Promise<void> {
  try {
    await adminStorage.bucket(BUCKET).file(path).delete()
  } catch (e) {
    // ignore not-found errors
    console.warn(`deleteFile: could not delete ${path}`, e)
  }
}

export async function deleteFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.map(deleteFile))
}
