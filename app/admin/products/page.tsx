import Link from 'next/link';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import DeleteProductButton from './_components/DeleteProductButton';

function MiniStatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-2xl font-black text-navy-950 leading-none">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminProductsPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: products }, { data: categoryData }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, brand, category, image_path')
      .order('created_at', { ascending: false }),
    supabase.from('products').select('category'),
  ]);

  const totalProducts = products?.length ?? 0;
  const distinctCategories = new Set(categoryData?.map((p) => p.category)).size;
  const panelsCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'panels').length ?? 0;
  const batteriesCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'batteries').length ?? 0;

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-navy-950 text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Product
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStatCard number={totalProducts} label="Total Products" />
        <MiniStatCard number={distinctCategories} label="Categories" />
        <MiniStatCard number={panelsCount} label="Panels" />
        <MiniStatCard number={batteriesCount} label="Batteries" />
      </div>

      {!products?.length ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-slate-400 font-medium text-sm mb-1">No items yet</p>
            <p className="text-slate-300 text-xs">Get started by adding your first item.</p>
          </div>
        </div>
      ) : (
        /* Product table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Image</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Name</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Brand</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
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
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-medium text-navy-900">{p.name}</td>

                  {/* Brand */}
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.brand ?? '—'}</td>

                  {/* Category badge */}
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          categoryColors[p.category.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.category}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <div className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <DeleteProductButton id={p.id} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
