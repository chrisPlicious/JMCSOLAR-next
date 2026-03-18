import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DeleteServiceButton from './_components/DeleteServiceButton';

export default async function AdminServicesPage() {
  const supabase = createSupabaseServerClient();
  const { data: services } = await supabase
    .from('services')
    .select('id, icon, title, highlight, display_order')
    .order('display_order', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-navy-950 text-2xl">Services</h1>
        <Link
          href="/admin/services/new"
          className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Service
        </Link>
      </div>

      {!services?.length ? (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-navy-950 font-semibold text-sm mb-1">No services yet.</p>
          <p className="text-slate-400 text-xs mb-5">Get started by adding your first service.</p>
          <Link
            href="/admin/services/new"
            className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            + New Service
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Icon</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Title</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Highlight</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Order</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{s.icon}</td>
                  <td className="px-6 py-4 font-medium text-navy-900">{s.title}</td>
                  <td className="px-6 py-4">
                    {s.highlight ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-solar-500/10 text-solar-600">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{s.display_order}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/services/${s.id}`}
                        className="text-navy-700 hover:text-navy-900 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteServiceButton id={s.id} />
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
