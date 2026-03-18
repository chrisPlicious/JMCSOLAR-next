import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

const ChevronRight = () => (
  <svg
    className="w-4 h-4 text-slate-300 group-hover:text-solar-500 transition-colors"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient();
  const [
    { count: projectCount },
    { count: productCount },
    { count: serviceCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div>
      {/* Page header */}
      <h1 className="font-display font-black text-navy-950 text-2xl mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your solar installation projects and product catalog.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <div className="border-t-2 border-solar-500" />
          <div className="p-6">
            <p className="text-4xl font-black text-navy-950">{projectCount ?? 0}</p>
            <p className="text-slate-500 text-sm mt-1">Total Projects</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <div className="border-t-2 border-solar-500" />
          <div className="p-6">
            <p className="text-4xl font-black text-navy-950">{productCount ?? 0}</p>
            <p className="text-slate-500 text-sm mt-1">Total Products</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <div className="border-t-2 border-solar-500" />
          <div className="p-6">
            <p className="text-4xl font-black text-navy-950">{serviceCount ?? 0}</p>
            <p className="text-slate-500 text-sm mt-1">Total Services</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <div className="border-t-2 border-solar-500" />
          <div className="p-6">
            <p className="text-4xl font-black text-navy-950">{reviewCount ?? 0}</p>
            <p className="text-slate-500 text-sm mt-1">Total Reviews</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/projects"
          className="block bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-6 hover:border-solar-500/30 hover:shadow-[0_4px_24px_0_rgb(0_0_0/0.10)] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-navy-950 text-base">Manage Projects</h2>
            <ChevronRight />
          </div>
          <p className="text-slate-500 text-sm">Add, edit and delete project entries with photos.</p>
        </Link>

        <Link
          href="/admin/products"
          className="block bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-6 hover:border-solar-500/30 hover:shadow-[0_4px_24px_0_rgb(0_0_0/0.10)] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-navy-950 text-base">Manage Products</h2>
            <ChevronRight />
          </div>
          <p className="text-slate-500 text-sm">Browse and manage your full product catalog.</p>
        </Link>

        <Link
          href="/admin/services"
          className="block bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-6 hover:border-solar-500/30 hover:shadow-[0_4px_24px_0_rgb(0_0_0/0.10)] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-navy-950 text-base">Manage Services</h2>
            <ChevronRight />
          </div>
          <p className="text-slate-500 text-sm">Add, edit and reorder your service offerings.</p>
        </Link>

        <Link
          href="/admin/reviews"
          className="block bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] p-6 hover:border-solar-500/30 hover:shadow-[0_4px_24px_0_rgb(0_0_0/0.10)] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-navy-950 text-base">Manage Reviews</h2>
            <ChevronRight />
          </div>
          <p className="text-slate-500 text-sm">Curate customer testimonials and ratings.</p>
        </Link>
      </div>
    </div>
  );
}
