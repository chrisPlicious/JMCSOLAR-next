import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteProjectAction } from './actions';

export default async function AdminProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, category, location, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-navy-900 font-black text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Projects
        </h1>
        <Link
          href="/admin/projects/new"
          className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Project
        </Link>
      </div>

      {!projects?.length ? (
        <p className="text-slate-400 text-sm">No projects yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900 text-sm">{p.title}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{p.category} · {p.location ?? 'No location'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-navy-900 text-sm font-medium hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteProjectAction.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="text-red-500 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
