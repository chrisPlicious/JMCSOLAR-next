'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type ActionResult = { error?: string; success?: boolean };

async function uploadProductImage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${productId}/product-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  return error ? null : path;
}

export async function createProductAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminAuth();
  const supabase = createSupabaseAdminClient();

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: formData.get('name') as string,
      brand: (formData.get('brand') as string) || null,
      category: formData.get('category') as string,
      specs: (formData.get('specs') as string) || null,
      description: (formData.get('description') as string) || null,
      badge: (formData.get('badge') as string) || null,
      related_service: (formData.get('related_service') as string) || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  if (product) {
    const file = formData.get('image') as File | null;
    if (file && file.size > 0) {
      const path = await uploadProductImage(supabase, product.id, file);
      if (path) {
        await supabase.from('products').update({ image_path: path }).eq('id', product.id);
      }
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
  const supabase = createSupabaseAdminClient();

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
    const path = await uploadProductImage(supabase, id, file);
    if (path) update.image_path = path;
  }

  const { error } = await supabase.from('products').update(update).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/products');
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdminAuth();
  const supabase = createSupabaseAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('image_path')
    .eq('id', id)
    .single();
  if (product?.image_path) {
    await supabase.storage.from('product-images').remove([product.image_path]);
  }
  await supabase.from('products').delete().eq('id', id);
  revalidatePath('/products');
  revalidatePath('/admin/products');
}
