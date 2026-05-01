/** Allowed image MIME types and their corresponding extensions. */
const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validate an uploaded image file.
 * Returns an error string if invalid, or null if the file is safe.
 */
export function validateImageUpload(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`;
  }

  const mime = file.type.toLowerCase();
  const allowedExts = ALLOWED_IMAGE_TYPES[mime];

  if (!allowedExts) {
    return `File type "${mime}" is not allowed. Use JPEG, PNG, WebP, or AVIF.`;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!allowedExts.includes(ext)) {
    return `File extension ".${ext}" does not match the declared type "${mime}".`;
  }

  return null;
}

/** Return a safe, lowercase extension for the file. Falls back to 'jpg'. */
export function safeExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = Object.values(ALLOWED_IMAGE_TYPES).flat();
  return allowed.includes(ext) ? ext : 'jpg';
}
