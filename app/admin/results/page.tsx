import { Plus } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import { Button } from '@/components/ui/Button';
import AdminPageHeader from '../_components/AdminPageHeader';
import {
  AdminEmptyState, AdminStatCard, AdminTableCard, EditIconLink, rowClass, thClass, theadClass,
} from '../_components/AdminTable';
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
      <AdminPageHeader
        title="Results"
        actions={
          <Button href="/admin/results/new" size="sm">
            <Plus size={16} aria-hidden />
            Add Result
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs">
        <AdminStatCard number={results.length} label="Total Results" />
      </div>

      {!results.length ? (
        <AdminEmptyState title="No results yet" body="Add before/after bill photos to get started." />
      ) : (
        <AdminTableCard>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Before</th>
                <th className={thClass}>After</th>
                <th className={thClass}>Order</th>
                <th className={thClass}>Date Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className={rowClass}>
                  <td className="px-4 py-3">
                    {r.beforeUrl && (
                      <img src={r.beforeUrl} alt="Before" className="w-14 h-14 object-cover rounded-md border border-line" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.afterUrl && (
                      <img src={r.afterUrl} alt="After" className="w-14 h-14 object-cover rounded-md border border-line" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted font-medium tabular-nums">{r.display_order}</td>
                  <td className="px-4 py-3 text-fg-subtle whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditIconLink href={`/admin/results/${r.id}`} />
                      <DeleteResultButton id={r.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableCard>
      )}
    </div>
  );
}
