/**
 * One-off backfill script — run manually after deploy:
 *   npx tsx scripts/backfill-city-slugs.ts
 *
 * Fuzzy-matches existing projects.location and reviews against LOCATIONS
 * names + nearbyAreas, then writes city_slug if confident.
 * Prints unmatched values for manual triage in the admin UI.
 */

import * as admin from 'firebase-admin';
import { LOCATIONS } from '../data/locations';

// Init Firebase Admin with ADC or service account
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function matchSlug(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = normalize(raw);

  for (const loc of LOCATIONS) {
    if (loc.tier !== 'municipality') continue;

    // Match against city name
    if (n.includes(normalize(loc.name))) return loc.slug;

    // Match against nearby areas
    for (const area of loc.nearbyAreas ?? []) {
      if (n.includes(normalize(area))) return loc.slug;
    }
  }
  return null;
}

async function backfill() {
  const unmatched: { collection: string; id: string; raw: string }[] = [];
  let projectsUpdated = 0;
  let reviewsUpdated = 0;

  // --- Projects ---
  const projectsSnap = await db.collection('projects').get();
  const projectBatch = db.batch();

  for (const doc of projectsSnap.docs) {
    const data = doc.data();
    if (data.city_slug) continue; // already tagged

    const raw = data.location as string | null;
    const slug = matchSlug(raw);

    if (slug) {
      projectBatch.update(doc.ref, { city_slug: slug });
      projectsUpdated++;
    } else if (raw) {
      unmatched.push({ collection: 'projects', id: doc.id, raw });
    }
  }
  await projectBatch.commit();

  // --- Reviews ---
  const reviewsSnap = await db.collection('reviews').get();
  const reviewBatch = db.batch();

  for (const doc of reviewsSnap.docs) {
    const data = doc.data();
    if (data.city_slug) continue; // already tagged

    // Reviews have no free-text city field — nothing to match
    unmatched.push({ collection: 'reviews', id: doc.id, raw: '(no city field)' });
  }
  await reviewBatch.commit();

  console.log(`\n✅ Projects updated: ${projectsUpdated}`);
  console.log(`✅ Reviews updated:  ${reviewsUpdated}`);

  if (unmatched.length > 0) {
    console.log(`\n⚠️  Unmatched (${unmatched.length}) — triage manually in admin:`);
    for (const u of unmatched) {
      console.log(`  [${u.collection}] ${u.id} → "${u.raw}"`);
    }
  } else {
    console.log('\n✅ All records matched.');
  }
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
