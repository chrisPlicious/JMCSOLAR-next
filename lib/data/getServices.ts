import { cache } from 'react';
import { adminDb } from '@/lib/firebase/admin';
import type { DbService, DbServiceDetail } from '@/lib/firebase/types';

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

/**
 * One service by slug. Wrapped in React `cache()` so generateMetadata and the
 * page share a single Firestore read per request.
 */
export const getServiceBySlug = cache(async (slug: string): Promise<DbService | null> => {
  const snap = await adminDb.collection('services').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as DbService;
});

/** The long-form detail doc for a service, or null when none was written. Cached per request. */
export const getServiceDetail = cache(async (serviceId: string): Promise<DbServiceDetail | null> => {
  const snap = await adminDb.collection('serviceDetails').where('service_id', '==', serviceId).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as DbServiceDetail);
});
