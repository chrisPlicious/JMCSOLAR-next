import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatCard({
  count,
  label,
  accent,
  secondary,
}: {
  count: number;
  label: string;
  accent: string;
  secondary: string;
}) {
  return (
    <div className="col-span-1 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      <div className={`h-1 w-full ${accent}`} />
      <div className="p-5">
        <p className="text-5xl font-black text-navy-950 leading-none">{count}</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">{label}</p>
        <p className="text-xs text-slate-400 mt-1">{secondary}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient();

  const [
    { count: projectCount },
    { count: productCount },
    { count: serviceCount },
    { count: reviewCount },
    { data: featuredServices },
    { data: recentProjects },
    { data: recentProducts },
    { data: reviewStats },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('id').eq('highlight', true),
    supabase.from('projects').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('rating'),
  ]);

  const recentActivity = [
    ...(recentProjects ?? []).map((p) => ({ title: p.title, created_at: p.created_at, type: 'project' as const })),
    ...(recentProducts ?? []).map((p) => ({ title: p.name, created_at: p.created_at, type: 'product' as const })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const avgRating =
    reviewStats && reviewStats.length > 0
      ? (reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length).toFixed(1)
      : null;

  return (
    <div className="flex items-center justify-center ">
      <div className="grid grid-cols-6 gap-4 flex-1">
        {/* Welcome banner: col-span-2 row-span-2 */}
        <div
          className="col-span-2 row-span-2 bg-navy-950 rounded-2xl p-6 flex flex-col justify-between min-h-[200px]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-solar-500" />
              <span className="text-xs uppercase tracking-widest font-bold text-white/40">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-1">JMC Solar PH</h1>
            <p className="text-white/50 text-sm">Manage your content from here.</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-white/30 text-xs">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <a
              href="/"
              target="_blank"
              className="text-solar-400/70 hover:text-solar-400 text-xs flex items-center gap-1 transition-colors"
            >
              View live site
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 9L9 1M9 1H3M9 1V7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
        {/* Projects stat */}
        <StatCard
          count={projectCount ?? 0}
          label="Projects"
          accent="bg-solar-500"
          secondary="residential · commercial · more"
        />
        {/* Products stat */}
        <StatCard
          count={productCount ?? 0}
          label="Products"
          accent="bg-blue-500"
          secondary="across multiple categories"
        />
        {/* Services stat */}
        <StatCard
          count={serviceCount ?? 0}
          label="Services"
          accent="bg-emerald-500"
          secondary={`${featuredServices?.length ?? 0} featured`}
        />
        {/* Reviews stat */}
        <StatCard
          count={reviewCount ?? 0}
          label="Reviews"
          accent="bg-violet-500"
          secondary={avgRating ? `★ ${avgRating} avg rating` : 'no ratings yet'}
        />
        {/* Quick actions: col-span-2 */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
          <div className="space-y-1">
            {[
              { label: 'New Project', href: '/admin/projects/new', icon: '📁' },
              { label: 'New Product', href: '/admin/products/new', icon: '📦' },
              { label: 'New Service', href: '/admin/services/new', icon: '⚙️' },
              { label: 'New Review', href: '/admin/reviews/new', icon: '★' },
            ].map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-solar-500/5 hover:text-solar-600 text-slate-700 transition-all group"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-solar-500/10 flex items-center justify-center text-sm transition-colors">
                  {icon}
                </span>
                <span className="text-sm font-medium flex-1">+ {label}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-slate-300 group-hover:text-solar-500 transition-colors"
                >
                  <path
                    d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
        {/* Recent activity: col-span-4 */}
        <div className="col-span-6 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Activity</p>
            <Link href="/admin/projects" className="text-xs text-solar-600 hover:text-solar-500 transition-colors">
              View all →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.type === 'project' ? 'bg-navy-950' : 'bg-solar-500'
                    }`}
                  />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.type === 'project'
                        ? 'bg-navy-50 text-navy-700'
                        : 'bg-solar-50 text-solar-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-sm text-slate-700 font-medium flex-1">{item.title}</span>
                  <span className="text-xs text-slate-400">{getRelativeTime(item.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
