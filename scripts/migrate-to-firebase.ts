/**
 * Supabase → Firebase Migration Script
 *
 * Usage:
 *   npx tsx scripts/migrate-to-firebase.ts
 *   npx tsx scripts/migrate-to-firebase.ts --dry-run
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from .env.local before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('\n[DRY RUN] No data will be written.\n');
}

// ---------------------------------------------------------------------------
// Validate required env vars
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const missing: string[] = [];
if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!FIREBASE_SERVICE_ACCOUNT_JSON) missing.push('FIREBASE_SERVICE_ACCOUNT_JSON');
if (!STORAGE_BUCKET) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Initialize Supabase admin client
// ---------------------------------------------------------------------------
const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Initialize Firebase Admin
// ---------------------------------------------------------------------------
let firebaseApp: admin.app.App;
if (admin.apps.length > 0) {
  firebaseApp = admin.apps[0]!;
} else {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON!);
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET!,
  });
}

const adminDb = admin.firestore(firebaseApp);
const adminStorage = admin.storage(firebaseApp);

// ---------------------------------------------------------------------------
// Summary tracking
// ---------------------------------------------------------------------------
interface CollectionResult {
  collection: string;
  count?: number;
  error?: string;
}

interface StorageResult {
  bucket: string;
  migrated: number;
  errors: string[];
}

const collectionResults: CollectionResult[] = [];
const storageResults: StorageResult[] = [];

// ---------------------------------------------------------------------------
// Helper: migrate a single Supabase table → Firestore collection
// ---------------------------------------------------------------------------
async function migrateCollection(
  tableName: string,
  firestoreCollection: string,
  docIdField: string = 'id'
): Promise<void> {
  console.log(`\n[${firestoreCollection}] Fetching from Supabase table "${tableName}"...`);

  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*');

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    const rows = data ?? [];
    console.log(`[${firestoreCollection}] Found ${rows.length} docs to migrate.`);

    if (!isDryRun) {
      const collRef = adminDb.collection(firestoreCollection);
      // Use batched writes for efficiency (max 500 per batch)
      const BATCH_SIZE = 400;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = adminDb.batch();
        const chunk = rows.slice(i, i + BATCH_SIZE);
        for (const row of chunk) {
          const docId: string = row[docIdField] as string;
          if (!docId) {
            console.warn(`[${firestoreCollection}] Row missing id field "${docIdField}", skipping.`);
            continue;
          }
          const docRef = collRef.doc(docId);
          batch.set(docRef, row);
        }
        await batch.commit();
        console.log(
          `[${firestoreCollection}] Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}).`
        );
      }
    } else {
      for (const row of rows) {
        console.log(
          `  [DRY RUN] Would write ${firestoreCollection}/${row[docIdField]}:`,
          JSON.stringify(row).substring(0, 120) + (JSON.stringify(row).length > 120 ? '...' : '')
        );
      }
    }

    collectionResults.push({ collection: firestoreCollection, count: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${firestoreCollection}] ERROR:`, message);
    collectionResults.push({ collection: firestoreCollection, error: message });
  }
}

// ---------------------------------------------------------------------------
// Helper: list all files in a Supabase storage bucket (recursively)
// ---------------------------------------------------------------------------
async function listAllFiles(
  bucket: string,
  prefix: string = ''
): Promise<string[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) {
    throw new Error(`Failed to list files in ${bucket}/${prefix}: ${error.message}`);
  }

  const paths: string[] = [];
  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // Folder — recurse
      const nested = await listAllFiles(bucket, itemPath);
      paths.push(...nested);
    } else {
      // File
      paths.push(itemPath);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Helper: migrate a single Supabase storage bucket → Firebase Storage
// ---------------------------------------------------------------------------
async function migrateBucket(supabaseBucket: string, firebasePrefix: string): Promise<void> {
  console.log(`\n[storage] Migrating bucket "${supabaseBucket}" → Firebase prefix "${firebasePrefix}/"`);

  const result: StorageResult = { bucket: supabaseBucket, migrated: 0, errors: [] };

  try {
    const files = await listAllFiles(supabaseBucket);
    console.log(`[storage] Found ${files.length} files in bucket "${supabaseBucket}".`);

    for (const filePath of files) {
      try {
        // Determine Firebase destination path
        // filePath already starts without the bucket name (e.g. "abc123/product-1234567890.jpg")
        // We store it under the same relative path within the firebasePrefix namespace
        const destPath = `${firebasePrefix}/${filePath}`;

        if (isDryRun) {
          console.log(`  [DRY RUN] Would copy: ${supabaseBucket}/${filePath} → ${destPath}`);
          result.migrated++;
          continue;
        }

        // Download from Supabase
        const { data: blob, error: downloadError } = await supabaseAdmin.storage
          .from(supabaseBucket)
          .download(filePath);

        if (downloadError || !blob) {
          throw new Error(`Download failed: ${downloadError?.message ?? 'no data'}`);
        }

        const buffer = Buffer.from(await blob.arrayBuffer());

        // Guess content type from extension
        const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
        const contentTypeMap: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          pdf: 'application/pdf',
        };
        const contentType = contentTypeMap[ext] ?? 'application/octet-stream';

        // Upload to Firebase Storage
        const firebaseFile = adminStorage.bucket(STORAGE_BUCKET!).file(destPath);
        await firebaseFile.save(buffer, {
          contentType,
          public: true,
          metadata: { contentType },
        });

        // Ensure the file is publicly accessible
        await firebaseFile.makePublic();

        console.log(`  [storage] ✓ ${destPath}`);
        result.migrated++;
      } catch (fileErr: unknown) {
        const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
        console.error(`  [storage] ✗ ${filePath}: ${msg}`);
        result.errors.push(`${filePath}: ${msg}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[storage] ERROR listing bucket "${supabaseBucket}": ${message}`);
    result.errors.push(`bucket listing: ${message}`);
  }

  storageResults.push(result);
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('=== Supabase → Firebase Migration ===');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Firebase bucket: ${STORAGE_BUCKET}`);
  console.log(`Dry run: ${isDryRun}`);
  console.log('');

  // Migrate Firestore collections
  await migrateCollection('services', 'services');
  await migrateCollection('service_details', 'serviceDetails');
  await migrateCollection('projects', 'projects');
  await migrateCollection('project_images', 'projectImages');
  await migrateCollection('products', 'products');
  await migrateCollection('reviews', 'reviews');
  await migrateCollection('contact_submissions', 'contactSubmissions');

  // Migrate Storage buckets
  await migrateBucket('product-images', 'product-images');
  await migrateBucket('project-images', 'project-images');

  // ---------------------------------------------------------------------------
  // Print summary
  // ---------------------------------------------------------------------------
  console.log('\n=== Migration Summary ===\n');
  console.log('Firestore Collections:');
  for (const r of collectionResults) {
    if (r.error) {
      console.log(`  ✗ ${r.collection}: ERROR: ${r.error}`);
    } else {
      console.log(`  ✓ ${r.collection}: ${r.count} doc(s)${isDryRun ? ' (dry run)' : ''}`);
    }
  }

  console.log('\nStorage Buckets:');
  for (const r of storageResults) {
    const status = r.errors.length === 0 ? '✓' : '✗';
    console.log(
      `  ${status} ${r.bucket}: ${r.migrated} file(s) migrated` +
        (r.errors.length > 0 ? `, ${r.errors.length} error(s)` : '') +
        (isDryRun ? ' (dry run)' : '')
    );
    for (const e of r.errors) {
      console.log(`      - ${e}`);
    }
  }

  const totalErrors =
    collectionResults.filter((r) => r.error).length +
    storageResults.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\nDone. ${totalErrors === 0 ? 'No errors.' : `${totalErrors} error(s) encountered.`}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
