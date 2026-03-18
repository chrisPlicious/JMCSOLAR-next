import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DeleteReviewButton from './_components/DeleteReviewButton';

export default async function AdminReviewsPage() {
  const supabase = createSupabaseServerClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, reviewer_name, source, rating, quote, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-navy-950 text-2xl">Reviews</h1>
        <Link
          href="/admin/reviews/new"
          className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Review
        </Link>
      </div>

      {!reviews?.length ? (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-navy-950 font-semibold text-sm mb-1">No reviews yet.</p>
          <p className="text-slate-400 text-xs mb-5">Get started by adding your first review.</p>
          <Link
            href="/admin/reviews/new"
            className="bg-solar-500 hover:bg-solar-600 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            + New Review
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Source</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Rating</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Quote</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-navy-900">{r.reviewer_name}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize bg-slate-100 text-slate-600">
                      {r.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-solar-500 font-semibold">
                    {'★'.repeat(r.rating)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs">
                    {r.quote.length > 60 ? r.quote.slice(0, 60) + '…' : r.quote}
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/reviews/${r.id}`}
                        className="text-navy-700 hover:text-navy-900 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteReviewButton id={r.id} />
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
