import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DeleteReviewButton from './_components/DeleteReviewButton';

function MiniStatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-2xl font-black text-navy-950 leading-none">{number}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminReviewsPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: reviews }, { data: statsData }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, reviewer_name, source, rating, quote, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('reviews').select('source, rating'),
  ]);

  const totalReviews = reviews?.length ?? 0;
  const avgRating =
    statsData && statsData.length > 0
      ? (statsData.reduce((sum, r) => sum + (r.rating ?? 0), 0) / statsData.length).toFixed(1)
      : '—';
  const googleCount = statsData?.filter((r) => r.source?.toLowerCase() === 'google').length ?? 0;
  const facebookCount = statsData?.filter((r) => r.source?.toLowerCase() === 'facebook').length ?? 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-navy-950 text-2xl">Reviews</h1>
        <Link
          href="/admin/reviews/new"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Review
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStatCard number={totalReviews} label="Total Reviews" />
        <MiniStatCard number={avgRating !== '—' ? `★ ${avgRating}` : '—'} label="Avg Rating" />
        <MiniStatCard number={googleCount} label="Google" />
        <MiniStatCard number={facebookCount} label="Facebook" />
      </div>

      {!reviews?.length ? (
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
        /* Reviews table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Name</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Source</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Rating</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Quote</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                >
                  <td className="px-4 py-3 font-medium text-navy-900">{r.reviewer_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize bg-slate-100 text-slate-600">
                      {r.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-solar-500 font-semibold">
                    {'★'.repeat(r.rating)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs">
                    {r.quote.length > 60 ? r.quote.slice(0, 60) + '…' : r.quote}
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/reviews/${r.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <div className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <DeleteReviewButton id={r.id} />
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
