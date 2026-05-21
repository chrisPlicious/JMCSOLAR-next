import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import DeleteResultButton from './_components/DeleteResultButton';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const snap = await adminDb.collection('results').orderBy('display_order', 'asc').get();
  const results = snap.docs.map((doc) => {
    const data = doc.data() as {
      before_image_path: string;
      after_image_path: string;
      display_order: number;
      created_at: string;
    };
    return {
      id: doc.id,
      ...data,
      beforeUrl: getPublicUrl(data.before_image_path),
      afterUrl: getPublicUrl(data.after_image_path),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-navy-950 text-2xl">Results</h1>
        <Link
          href="/admin/results/new"
          className="bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + Add Result
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-2xl font-black text-navy-950 leading-none">{results.length}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">Total Results</p>
        </div>
      </div>

      {!results.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium text-sm mb-1">No results yet</p>
            <p className="text-slate-300 text-xs">Add before/after bill photos to get started.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Before</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">After</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Order</th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-3 text-left">Date Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-500/5 transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    {r.beforeUrl && (
                      <img src={r.beforeUrl} alt="Before" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.afterUrl && (
                      <img src={r.afterUrl} alt="After" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{r.display_order}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/results/${r.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      <div className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <DeleteResultButton id={r.id} />
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
