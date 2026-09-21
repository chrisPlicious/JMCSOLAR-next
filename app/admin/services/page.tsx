import { Plus } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AdminPageHeader from '../_components/AdminPageHeader';
import {
  AdminEmptyState, AdminStatCard, AdminTableCard, EditIconLink, rowClass, thClass, theadClass,
} from '../_components/AdminTable';
import DeleteServiceButton from './_components/DeleteServiceButton';

export const dynamic = 'force-dynamic';

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
      <AdminPageHeader
        title="Services"
        actions={
          <Button href="/admin/services/new" size="sm">
            <Plus size={16} aria-hidden />
            New Service
          </Button>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <AdminStatCard number={totalServices} label="Total Services" />
        <AdminStatCard number={featuredCount} label="Featured" />
        <AdminStatCard number={orderRange} label="Order Range" />
        <AdminStatCard number={totalServices - featuredCount} label="Not Featured" />
      </div>

      {!services?.length ? (
        <AdminEmptyState title="No items yet" body="Get started by adding your first item." />
      ) : (
        /* Services table */
        <AdminTableCard>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Icon</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Highlight</th>
                <th className={thClass}>Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={rowClass}>
                  <td className="px-4 py-3 text-fg-subtle font-mono text-xs">{s.icon}</td>
                  <td className="px-4 py-3 font-medium text-fg">{s.title}</td>
                  <td className="px-4 py-3">
                    {s.highlight ? (
                      <Badge tone="solar">★ Featured</Badge>
                    ) : (
                      <span className="text-fg-subtle text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted tabular-nums">{s.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditIconLink href={`/admin/services/${s.id}`} />
                      <DeleteServiceButton id={s.id} />
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
