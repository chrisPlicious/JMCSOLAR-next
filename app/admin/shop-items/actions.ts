'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';
import { validateImageUpload, safeExtension } from '@/lib/upload-validation';
import { requireField, optionalField } from '@/lib/form-data';
import { slugify, pesosToCentavos, parseNonNegInt, parseVariants } from '@/lib/shop/validation';
import type { DbShopItem, DbShopItemVariant } from '@/lib/firebase/types';

type ActionResult = { error?: string; success?: boolean };

const SHOP_ITEM_CATEGORIES = ['lights', 'wires', 'accessories'];

/** True if `slug` is already used by a different shop item. */
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const snap = await adminDb.collection('shopItems').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return false;
  return snap.docs[0].id !== exceptId;
}

async function uploadShopItemImage(itemId: string, file: File): Promise<string | null> {
  const validationError = await validateImageUpload(file);
  if (validationError) return null;

  const ext = safeExtension(file);
  const path = `shop-item-images/${itemId}/shop-item-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await uploadFile(path, buffer, file.type || 'image/jpeg');
    return path;
  } catch {
    return null;
  }
}

/** Shared field parsing for create + update. Returns the parsed core fields or an error. */
function parseCoreFields(
  formData: FormData,
): { error: string } | {
  name: string;
  category: string;
  sku: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  low_stock_threshold: number | null;
  active: boolean;
  weight_grams: number | null;
  meta_title: string | null;
  meta_description: string | null;
  variants: DbShopItemVariant[] | null;
} {
  const name = requireField(formData, 'name');
  const category = requireField(formData, 'category');
  const sku = requireField(formData, 'sku');
  if (!name) return { error: 'Item name is required.' };
  if (!category) return { error: 'Category is required.' };
  if (!SHOP_ITEM_CATEGORIES.includes(category)) return { error: 'Invalid category.' };
  if (!sku) return { error: 'SKU is required.' };

  // slug: explicit field wins; otherwise derive from name.
  const slugRaw = optionalField(formData, 'slug');
  const slug = slugify(slugRaw ?? name);
  if (!slug) return { error: 'Could not derive a valid slug. Provide a slug or a name with letters/numbers.' };

  const price = pesosToCentavos(requireField(formData, 'price'));
  if (price == null) return { error: 'A valid price (₱) is required.' };

  const stock = parseNonNegInt(requireField(formData, 'stock'));
  if (!stock.valid || stock.value == null) return { error: 'A valid stock count is required.' };

  const lowStock = parseNonNegInt(optionalField(formData, 'low_stock_threshold'));
  if (!lowStock.valid) return { error: 'Low-stock threshold must be a non-negative whole number.' };

  const weight = parseNonNegInt(optionalField(formData, 'weight_grams'));
  if (!weight.valid) return { error: 'Weight must be a non-negative whole number (grams).' };

  const { variants, error: variantError } = parseVariants(optionalField(formData, 'variants'));
  if (variantError) return { error: variantError };

  return {
    name,
    category,
    sku,
    slug,
    description: optionalField(formData, 'description') ?? '',
    price,
    stock: stock.value,
    low_stock_threshold: lowStock.value,
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
    weight_grams: weight.value,
    meta_title: optionalField(formData, 'meta_title'),
    meta_description: optionalField(formData, 'meta_description'),
    variants,
  };
}

export async function createShopItemAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const parsed = parseCoreFields(formData);
  if ('error' in parsed) return { error: parsed.error };

  // Image is required for a new item — validate before writing anything.
  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) return { error: 'An item image is required.' };
  const imageError = await validateImageUpload(file);
  if (imageError) return { error: imageError };

  if (await slugTaken(parsed.slug)) {
    return { error: `Slug "${parsed.slug}" is already in use. Choose a different slug.` };
  }

  const itemId = crypto.randomUUID();
  const now = new Date().toISOString();

  const doc: DbShopItem = {
    id: itemId,
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    category: parsed.category,
    sku: parsed.sku,
    price: parsed.price,
    stock: parsed.stock,
    low_stock_threshold: parsed.low_stock_threshold,
    active: parsed.active,
    weight_grams: parsed.weight_grams,
    image_path: null,
    variants: parsed.variants,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
    created_at: now,
    updated_at: now,
  };

  try {
    // create() so a UUID collision fails loudly instead of silently overwriting.
    await adminDb.collection('shopItems').doc(itemId).create(doc);
  } catch (e: unknown) {
    console.error('[createShopItemAction]', e);
    return { error: 'Failed to create shop item' };
  }

  const path = await uploadShopItemImage(itemId, file);
  if (!path) {
    // Upload failed after the doc was created — roll back so we never leave an
    // item without its (required) image.
    await adminDb.collection('shopItems').doc(itemId).delete().catch(() => {});
    return { error: 'Image upload failed. Please try again.' };
  }
  await adminDb.collection('shopItems').doc(itemId).update({ image_path: path });

  revalidatePath('/shop');
  revalidatePath('/admin/shop-items');
  return { success: true };
}

export async function updateShopItemAction(
  id: string,
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const parsed = parseCoreFields(formData);
  if ('error' in parsed) return { error: parsed.error };

  if (await slugTaken(parsed.slug, id)) {
    return { error: `Slug "${parsed.slug}" is already in use. Choose a different slug.` };
  }

  const snap = await adminDb.collection('shopItems').doc(id).get();
  const existing = snap.data() as DbShopItem | undefined;

  const file = formData.get('image') as File | null;
  const hasNewFile = Boolean(file && file.size > 0);

  // Image is required — the item must still have one after the edit.
  if (!hasNewFile && !existing?.image_path) {
    return { error: 'An item image is required.' };
  }
  if (hasNewFile) {
    const imageError = await validateImageUpload(file!);
    if (imageError) return { error: imageError };
  }

  const update: Partial<DbShopItem> = {
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    category: parsed.category,
    sku: parsed.sku,
    price: parsed.price,
    stock: parsed.stock,
    low_stock_threshold: parsed.low_stock_threshold,
    active: parsed.active,
    weight_grams: parsed.weight_grams,
    variants: parsed.variants,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
    updated_at: new Date().toISOString(),
  };

  if (hasNewFile) {
    const path = await uploadShopItemImage(id, file!);
    if (!path) return { error: 'Image upload failed. Please try again.' };
    if (existing?.image_path) await deleteFile(existing.image_path);
    update.image_path = path;
  }

  try {
    await adminDb.collection('shopItems').doc(id).update(update);
  } catch (e: unknown) {
    console.error('[updateShopItemAction]', e);
    return { error: 'Failed to update shop item' };
  }

  revalidatePath('/shop');
  revalidatePath(`/shop/${parsed.slug}`);
  revalidatePath('/admin/shop-items');
  return { success: true };
}

export async function deleteShopItemAction(id: string): Promise<void> {
  await requireAdminAuth();

  const snap = await adminDb.collection('shopItems').doc(id).get();
  const item = snap.data() as DbShopItem | undefined;
  if (item?.image_path) {
    await deleteFile(item.image_path);
  }

  await adminDb.collection('shopItems').doc(id).delete();

  revalidatePath('/shop');
  revalidatePath('/admin/shop-items');
}
