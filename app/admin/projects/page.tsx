import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DeleteProjectButton from './_components/DeleteProjectButton';

function MiniStatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-2xl font-black text-navy-950 leading-none">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminProjectsPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: projects }, { data: categoryData }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, category, location, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('category'),
  ]);

  const totalProjects = projects?.length ?? 0;
  const residentialCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'residential').length ?? 0;
  const commercialCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'commercial').length ?? 0;
  const agriculturalCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'agricultural').length ?? 0;

  const categoryColors: Record<string, string> = {
    residential: 'bg-emerald-50 text-emerald-700',
    commercial: 'bg-blue-50 text-blue-700',
    industrial: 'bg-orange-50 text-orange-700',
    agricultural: 'bg-lime-50 text-lime-700',
    school: 'bg-purple-50 text-purple-700',
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-navy-950 text-2xl">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStatCard number={totalProjects} label="Total Projects" />
        <MiniStatCard number={residentialCount} label="Residential" />
        <MiniStatCard number={commercialCount} label="Commercial" />
        <MiniStatCard number={agriculturalCount} label="Agricultural" />
      </div>

      {!projects?.length ? (
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
        /* Projects table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Title</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Location</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Category</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                >
                  {/* Title with avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {p.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-navy-900">{p.title}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.location ?? '—'}</td>

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

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <div className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <DeleteProjectButton id={p.id} />
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
