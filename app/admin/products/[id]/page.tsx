import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import EditProductForm from '../_components/EditProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();
  if (!product) notFound();
  const imageUrl = getPublicUrl('product-images', product.image_path);
  return <EditProductForm product={product} imageUrl={imageUrl} />;
}
