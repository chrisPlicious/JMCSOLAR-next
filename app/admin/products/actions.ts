'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';

type ActionResult = { error?: string; success?: boolean };

async function uploadProductImage(productId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
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

  const productId = crypto.randomUUID();

  try {
    await adminDb.collection('products').doc(productId).set({
      id: productId,
      name: formData.get('name') as string,
      brand: (formData.get('brand') as string) || null,
      category: formData.get('category') as string,
      specs: (formData.get('specs') as string) || null,
      description: (formData.get('description') as string) || null,
      badge: (formData.get('badge') as string) || null,
      related_service: (formData.get('related_service') as string) || null,
      image_path: null,
      created_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create product' };
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

  const update: Record<string, string | null> = {
    name: formData.get('name') as string,
    brand: (formData.get('brand') as string) || null,
    category: formData.get('category') as string,
    specs: (formData.get('specs') as string) || null,
    description: (formData.get('description') as string) || null,
    badge: (formData.get('badge') as string) || null,
    related_service: (formData.get('related_service') as string) || null,
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
    return { error: e instanceof Error ? e.message : 'Failed to update product' };
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
