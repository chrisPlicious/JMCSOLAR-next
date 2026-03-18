import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import { updateProjectAction, deleteImageAction, setCoverAction } from '../actions';

const categories = ['residential', 'commercial', 'industrial', 'agricultural', 'school'];

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const [{ data: project }, { data: images }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase.from('project_images').select('*').eq('project_id', params.id).order('display_order'),
  ]);

  if (!project) notFound();

  const updateWithId = updateProjectAction.bind(null, params.id);

  return (
    <div>
      <h1 className="text-navy-900 font-black text-2xl mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Edit Project
      </h1>

      <form action={updateWithId} className="space-y-5 max-w-xl mb-12">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input name="title" defaultValue={project.title} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
          <select name="category" defaultValue={project.category} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900">
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">System Size</label>
          <input name="system_size" defaultValue={project.system_size ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input name="location" defaultValue={project.location ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Post URL</label>
          <input name="facebook_url" type="url" defaultValue={project.facebook_url ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={project.description ?? ''} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Add New Photo</label>
          <input name="new_image" type="file" accept="image/*" className="w-full text-sm" />
          <label className="flex items-center gap-2 mt-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" name="set_as_cover" value="true" />
            Set as cover image
          </label>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            Save Changes
          </button>
          <a href="/admin/projects" className="text-slate-500 hover:text-slate-700 text-sm">Cancel</a>
        </div>
      </form>

      <div>
        <h2 className="font-bold text-navy-900 text-lg mb-4">Photos</h2>
        {!images?.length ? (
          <p className="text-slate-400 text-sm">No photos yet. Upload one above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => {
              const url = getPublicUrl('project-images', img.storage_path);
              const isCover = img.storage_path === project.cover_image_path;
              return (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200">
                  {url && <img src={url} alt="" className="w-full aspect-video object-cover" />}
                  {isCover && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-solar-500 text-white px-2 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                  <div className="flex gap-2 p-2">
                    {!isCover && (
                      <form action={setCoverAction.bind(null, params.id, img.storage_path)}>
                        <button type="submit" className="text-xs text-navy-900 hover:underline">Set cover</button>
                      </form>
                    )}
                    <form action={deleteImageAction.bind(null, img.id, img.storage_path, params.id)}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
