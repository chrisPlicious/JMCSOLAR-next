import { adminDb } from '@/lib/firebase/admin';
import type { DbService } from '@/lib/firebase/types';

/**
 * Server-only fetch of the live `services` collection, ordered by display_order.
 * Single source of truth reused by the homepage, the /services grid, and the
 * sitemap so they never drift. Returns [] on error so callers still render.
 */
export async function getServices(): Promise<DbService[]> {
  try {
    const snap = await adminDb.collection('services').orderBy('display_order').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DbService);
  } catch {
    return [];
  }
}
