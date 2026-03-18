import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DeleteProjectButton from './_components/DeleteProjectButton';

export default async function AdminProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, category, location, created_at')
    .order('created_at', { ascending: false });

  const categoryColors: Record<string, string> = {
    residential: 'bg-emerald-50 text-emerald-700',
    commercial: 'bg-blue-50 text-blue-700',
    industrial: 'bg-orange-50 text-orange-700',
    agricultural: 'bg-lime-50 text-lime-700',
    school: 'bg-purple-50 text-purple-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-navy-950 text-2xl">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Project
        </Link>
      </div>

      {!projects?.length ? (
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
              d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 6.793H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11v4m0 0l-1.5-1.5M12 15l1.5-1.5"
            />
          </svg>
          <p className="text-navy-950 font-semibold text-sm mb-1">No projects yet.</p>
          <p className="text-slate-400 text-xs mb-5">Get started by creating your first project.</p>
          <Link
            href="/admin/projects/new"
            className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            + New Project
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {p.title.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-navy-900 text-sm">{p.title}</p>
                {p.location && (
                  <p className="text-slate-400 text-xs">{p.location}</p>
                )}
              </div>
              {p.category && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    categoryColors[p.category.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.category}
                </span>
              )}
              <div className="ml-auto flex items-center gap-4">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-navy-700 hover:text-navy-900 text-sm font-medium transition-colors"
                >
                  Edit
                </Link>
                <DeleteProjectButton id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
