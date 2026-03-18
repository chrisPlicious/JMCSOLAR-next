import { createProjectAction } from '../actions';

const categories = ['residential', 'commercial', 'industrial', 'agricultural', 'school'];

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        New Project
      </h1>

      <form action={createProjectAction} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input name="title" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">System Size</label>
          <input name="system_size" placeholder="e.g. 10 kWp" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input name="location" placeholder="e.g. Ormoc City, Leyte" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Post URL</label>
          <input name="facebook_url" type="url" placeholder="https://facebook.com/..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
          <input name="cover_image" type="file" accept="image/*" className="w-full text-sm" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Create Project
          </button>
          <a href="/admin/projects" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  );
}
