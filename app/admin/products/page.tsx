import Link from 'next/link';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import DeleteProductButton from './_components/DeleteProductButton';

export default async function AdminProductsPage() {
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, category, image_path')
    .order('created_at', { ascending: false });

  const categoryColors: Record<string, string> = {
    panels: 'bg-yellow-50 text-yellow-700',
    batteries: 'bg-green-50 text-green-700',
    inverters: 'bg-blue-50 text-blue-700',
    controllers: 'bg-orange-50 text-orange-700',
    converters: 'bg-purple-50 text-purple-700',
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-navy-950 text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Product
        </Link>
      </div>

      {!products?.length ? (
        /* Empty state */
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <svg
            className="w-12 h-12 text-slate-200 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8l-2 4h12l-2-4z" />
          </svg>
          <p className="text-navy-950 font-semibold text-sm mb-1">No products yet.</p>
          <p className="text-slate-400 text-xs mb-5">Get started by adding your first product.</p>
          <Link
            href="/admin/products/new"
            className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            + New Product
          </Link>
        </div>
      ) : (
        /* Product list */
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
            >
              {/* Thumbnail */}
              {p.image_path ? (
                <img
                  src={getPublicUrl('product-images', p.image_path)!}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8l-2 4h12l-2-4z" />
                  </svg>
                </div>
              )}

              {/* Text block */}
              <div>
                <p className="font-medium text-navy-900 text-sm">{p.name}</p>
                {p.brand && <p className="text-slate-400 text-xs">{p.brand}</p>}
              </div>

              {/* Category badge */}
              {p.category && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    categoryColors[p.category.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.category}
                </span>
              )}

              {/* Actions */}
              <div className="ml-auto flex items-center gap-4">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-navy-700 hover:text-navy-900 text-sm font-medium transition-colors"
                >
                  Edit
                </Link>
                <DeleteProductButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
