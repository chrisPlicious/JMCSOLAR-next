import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteProductAction } from './actions';

export default async function AdminProductsPage() {
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, category')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-navy-900 font-black text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Product
        </Link>
      </div>

      {!products?.length ? (
        <p className="text-slate-400 text-sm">No products yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900 text-sm">{p.name}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{p.brand} · {p.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/products/${p.id}`} className="text-navy-900 text-sm font-medium hover:underline">Edit</Link>
                <form action={deleteProductAction.bind(null, p.id)}>
                  <button type="submit" className="text-red-500 text-sm hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
