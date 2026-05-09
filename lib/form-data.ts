/** Extract a required string field from FormData. Returns null if missing or blank. */
export function requireField(data: FormData, key: string): string | null {
  const val = (data.get(key) as string | null)?.trim();
  return val || null;
}

/** Extract an optional string field. Returns null if missing or blank. */
export function optionalField(data: FormData, key: string): string | null {
  const val = (data.get(key) as string | null)?.trim();
  return val || null;
}
