import { adminStorage } from './admin'

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = adminStorage.bucket(BUCKET)
  const file = bucket.file(path)
  await file.save(buffer, { contentType, public: true })
  return `https://storage.googleapis.com/${BUCKET}/${path}`
}

export function getPublicUrl(path: string | null): string | null {
  if (!path) return null
  // M6: if already a full URL (e.g. migrated data), return as-is to avoid double-prefix
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `https://storage.googleapis.com/${BUCKET}/${path}`
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
