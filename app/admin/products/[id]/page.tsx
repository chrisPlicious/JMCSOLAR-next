import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import { updateProductAction } from '../actions';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();

  if (!product) notFound();

  const updateWithId = updateProductAction.bind(null, params.id);
  const imageUrl = getPublicUrl('product-images', product.image_path);

  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Edit Product
      </h1>

      {imageUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Current Image</p>
          <img src={imageUrl} alt={product.name} className="w-40 h-40 object-contain rounded-xl border border-slate-200 bg-slate-50 p-2" />
        </div>
      )}

      <form action={updateWithId} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input name="name" defaultValue={product.name} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input name="brand" defaultValue={product.brand ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" defaultValue={product.category} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Specs</label>
          <input name="specs" defaultValue={product.specs ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={product.description ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
          <input name="badge" defaultValue={product.badge ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related Service</label>
          <select name="related_service" defaultValue={product.related_service ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            <option value="">None</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Replace Image</label>
          <input name="image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Save Changes
          </button>
          <a href="/admin/products" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
