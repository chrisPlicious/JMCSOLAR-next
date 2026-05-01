/**
 * One-time migration script to stamp all existing review documents
 * with `status: 'approved'` so the filtered public query works.
 *
 * Run: npx tsx scripts/migrate-review-status.ts
 */

import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config({ path: '.env.local' });

const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!json) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(json) as admin.ServiceAccount;
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore(app);

async function main() {
  const snap = await db.collection('reviews').get();
  console.log(`Found ${snap.size} reviews`);

  let updated = 0;
  let skipped = 0;

  const batch = db.batch();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.status) {
      skipped++;
      continue;
    }
    batch.update(doc.ref, { status: 'approved' });
    updated++;
  }

  if (updated > 0) {
    await batch.commit();
  }

  console.log(`Done: ${updated} updated, ${skipped} already had status`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
