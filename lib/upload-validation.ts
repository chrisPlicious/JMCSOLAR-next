/** Allowed image MIME types and their corresponding extensions. */
const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Magic byte signatures per MIME type. All entries must match (AND logic). */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png':  [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  // WebP: "RIFF" at 0 AND "WEBP" at offset 8
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  // AVIF: ISO BMFF "ftyp" box marker at offset 4
  'image/avif': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
};

async function readBytes(file: File, n: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, n).arrayBuffer());
}

function matchesMagic(
  buf: Uint8Array,
  sigs: { offset: number; bytes: number[] }[],
): boolean {
  return sigs.every(({ offset, bytes }) =>
    bytes.every((b, i) => buf[offset + i] === b),
  );
}

/**
 * Validate an uploaded image file.
 * Returns an error string if invalid, or null if the file is safe.
 */
export async function validateImageUpload(file: File): Promise<string | null> {
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

  // Server-side magic bytes check — client cannot spoof this
  const signatures = MAGIC_BYTES[mime];
  if (signatures) {
    const maxRead = Math.max(...signatures.map(({ offset, bytes }) => offset + bytes.length));
    const buf = await readBytes(file, maxRead);
    if (!matchesMagic(buf, signatures)) {
      return `File magic bytes do not match declared type "${mime}". Upload a real image.`;
    }
  }

  return null;
}

/** Return a safe, lowercase extension for the file. Falls back to 'jpg'. */
export function safeExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = Object.values(ALLOWED_IMAGE_TYPES).flat();
  return allowed.includes(ext) ? ext : 'jpg';
}
