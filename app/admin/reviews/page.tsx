import { adminDb } from '@/lib/firebase/admin';
import Badge from '@/components/ui/Badge';
import AdminPageHeader from '../_components/AdminPageHeader';
import {
  AdminEmptyState, AdminStatCard, AdminTableCard, EditIconLink, rowClass, thClass, theadClass,
} from '../_components/AdminTable';
import DeleteReviewButton from './_components/DeleteReviewButton';
import NewReviewDialog from './_components/NewReviewDialog';
import ReviewStatusActions from './_components/ReviewStatusActions';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const snap = await adminDb.collection('reviews').orderBy('created_at', 'desc').get();
  const rawReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as {
    id: string;
    reviewer_name: string;
    source: string;
    rating: number;
    quote: string;
    created_at: string;
    status?: string;
  }[];

  // Sort: pending first, then by created_at desc
  const reviews = [...rawReviews].sort((a, b) => {
    const order = (s?: string) => s === 'pending' ? 0 : 1;
    return order(a.status) - order(b.status);
  });

  const statsData = reviews;

  const totalReviews = reviews?.length ?? 0;
  const avgRating =
    statsData && statsData.length > 0
      ? (statsData.reduce((sum, r) => sum + (r.rating ?? 0), 0) / statsData.length).toFixed(1)
      : '—';
  const googleCount = statsData?.filter((r) => r.source?.toLowerCase() === 'google').length ?? 0;
  const facebookCount = statsData?.filter((r) => r.source?.toLowerCase() === 'facebook').length ?? 0;
  const pendingCount = statsData?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div>
      <AdminPageHeader title="Reviews" actions={<NewReviewDialog />} />

      {/* Stat strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <AdminStatCard number={totalReviews} label="Total Reviews" />
        <AdminStatCard number={avgRating !== '—' ? `★ ${avgRating}` : '—'} label="Avg Rating" />
        <AdminStatCard number={googleCount} label="Google" />
        <AdminStatCard number={facebookCount} label="Facebook" />
        <AdminStatCard number={pendingCount} label="Pending" />
      </div>

      {!reviews?.length ? (
        <AdminEmptyState title="No items yet" body="Get started by adding your first item." />
      ) : (
        /* Reviews table */
        <AdminTableCard>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Source</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Rating</th>
                <th className={thClass}>Quote</th>
                <th className={thClass}>Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const s = r.status ?? 'approved';
                const statusTone = s === 'pending' ? 'solar' : s === 'rejected' ? 'danger' : 'success';
                return (
                  <tr key={r.id} className={rowClass}>
                    <td className="px-4 py-3 font-medium text-fg">{r.reviewer_name}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" className="capitalize">{r.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone} className="capitalize">{s}</Badge>
                    </td>
                    <td className="px-4 py-3 text-solar-ink font-semibold" aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(r.rating)}
                    </td>
                    <td className="px-4 py-3 text-fg-muted max-w-xs">
                      {r.quote.length > 60 ? r.quote.slice(0, 60) + '…' : r.quote}
                    </td>
                    <td className="px-4 py-3 text-fg-subtle whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ReviewStatusActions id={r.id} status={r.status} />
                        <EditIconLink href={`/admin/reviews/${r.id}`} />
                        <DeleteReviewButton id={r.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableCard>
      )}
    </div>
  );
}
