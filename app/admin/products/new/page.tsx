import { createProductAction } from '../actions';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        New Product
      </h1>

      <form action={createProductAction} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input name="name" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input name="brand" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Specs</label>
          <input name="specs" placeholder="e.g. 550W · Mono PERC" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
          <input name="badge" placeholder="e.g. Best Seller" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related Service</label>
          <select name="related_service" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            <option value="">None</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
          <input name="image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Create Product
          </button>
          <a href="/admin/products" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
