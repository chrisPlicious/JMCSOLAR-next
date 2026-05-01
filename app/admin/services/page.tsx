import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import DeleteServiceButton from './_components/DeleteServiceButton';

export const dynamic = 'force-dynamic';

function MiniStatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-2xl font-black text-navy-950 leading-none">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminServicesPage() {
  const snap = await adminDb.collection('services').orderBy('display_order', 'asc').get();
  const services = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as {
    id: string;
    icon: string;
    title: string;
    highlight: boolean;
    display_order: number;
  }[];

  const totalServices = services?.length ?? 0;
  const featuredCount = services?.filter((s) => s.highlight === true).length ?? 0;
  const minOrder = services && services.length > 0 ? Math.min(...services.map((s) => s.display_order)) : null;
  const maxOrder = services && services.length > 0 ? Math.max(...services.map((s) => s.display_order)) : null;
  const orderRange = minOrder !== null && maxOrder !== null ? `${minOrder}–${maxOrder}` : '—';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-navy-950 text-2xl">Services</h1>
        <Link
          href="/admin/services/new"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Service
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStatCard number={totalServices} label="Total Services" />
        <MiniStatCard number={featuredCount} label="Featured" />
        <MiniStatCard number={orderRange} label="Order Range" />
        <MiniStatCard number={totalServices - featuredCount} label="Not Featured" />
      </div>

      {!services?.length ? (
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
        /* Services table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Icon</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Title</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Highlight</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.icon}</td>
                  <td className="px-4 py-3 font-medium text-navy-900">{s.title}</td>
                  <td className="px-4 py-3">
                    {s.highlight ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-solar-500/10 text-solar-600">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/services/${s.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <div className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <DeleteServiceButton id={s.id} />
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
