import ProductsPage from '@/page-components/products/ProductsIndex';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import type { Product } from '@/types';

export default async function Products() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const products: Product[] = (data ?? []).map((p) => ({
    ...p,
    image_path: getPublicUrl('product-images', p.image_path),
  }));

  return <ProductsPage products={products} />;
}
