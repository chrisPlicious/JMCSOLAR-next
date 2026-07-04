'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';
import { validateImageUpload, safeExtension } from '@/lib/upload-validation';
import { requireField, optionalField } from '@/lib/form-data';
import { slugify } from '@/lib/seo/slug';

type ActionResult = { error?: string; success?: boolean };

// Unique, stable slug for the product's /products/[slug] detail URL. Falls back to a
// short id suffix on collision. Slugs never change on rename (see updateProductAction).
async function uniqueProductSlug(name: string, productId: string): Promise<string> {
  const base = slugify(name) || 'product';
  const existing = await adminDb.collection('products').where('slug', '==', base).limit(1).get();
  return existing.empty ? base : `${base}-${productId.slice(0, 4)}`;
}

async function uploadProductImage(productId: string, file: File): Promise<string | null> {
  const validationError = await validateImageUpload(file);
  if (validationError) return null;

  const ext = safeExtension(file);
  const path = `product-images/${productId}/product-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await uploadFile(path, buffer, file.type || 'image/jpeg');
    return path;
  } catch {
    return null;
  }
}

export async function createProductAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminAuth();

  const name = requireField(formData, 'name');
  const category = requireField(formData, 'category');
  if (!name) return { error: 'Product name is required.' };
  if (!category) return { error: 'Category is required.' };

  const productId = crypto.randomUUID();
  const slug = await uniqueProductSlug(name, productId);

  try {
    // M3: use create() so a UUID collision fails loudly instead of silently overwriting
    await adminDb.collection('products').doc(productId).create({
      id: productId,
      slug,
      name,
      category,
      brand: optionalField(formData, 'brand'),
      specs: optionalField(formData, 'specs'),
      description: optionalField(formData, 'description'),
      badge: optionalField(formData, 'badge'),
      related_service: optionalField(formData, 'related_service'),
      image_path: null,
      created_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    console.error('[createProductAction]', e);
    return { error: 'Failed to create product' };
  }

  const file = formData.get('image') as File | null;
  if (file && file.size > 0) {
    const path = await uploadProductImage(productId, file);
    if (path) {
      await adminDb.collection('products').doc(productId).update({ image_path: path });
    }
  }

  revalidatePath('/products');
  revalidatePath('/admin/products');
  return { success: true };
}

export async function updateProductAction(
  id: string,
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminAuth();

  const name = requireField(formData, 'name');
  const category = requireField(formData, 'category');
  if (!name) return { error: 'Product name is required.' };
  if (!category) return { error: 'Category is required.' };

  // NOTE: `slug` is intentionally NOT updated — it must stay stable across renames so
  // previously-indexed /products/[slug] URLs don't 404. (Existing slug-less docs are
  // filled by scripts/backfill-product-slugs.mjs.)
  const update: Record<string, string | null> = {
    name,
    category,
    brand: optionalField(formData, 'brand'),
    specs: optionalField(formData, 'specs'),
    description: optionalField(formData, 'description'),
    badge: optionalField(formData, 'badge'),
    related_service: optionalField(formData, 'related_service'),
  };

  const file = formData.get('image') as File | null;
  if (file && file.size > 0) {
    // Fix: fetch old product to delete its image before uploading the new one
    const snap = await adminDb.collection('products').doc(id).get();
    const existing = snap.data();
    if (existing?.image_path) {
      await deleteFile(existing.image_path);
    }

    const path = await uploadProductImage(id, file);
    if (path) update.image_path = path;
  }

  try {
    await adminDb.collection('products').doc(id).update(update);
  } catch (e: unknown) {
    console.error('[updateProductAction]', e);
    return { error: 'Failed to update product' };
  }

  revalidatePath('/products');
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdminAuth();

  const snap = await adminDb.collection('products').doc(id).get();
  const product = snap.data();
  if (product?.image_path) {
    await deleteFile(product.image_path);
  }

  await adminDb.collection('products').doc(id).delete();

  revalidatePath('/products');
  revalidatePath('/admin/products');
}
