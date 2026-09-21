import { Plus } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { Button } from '@/components/ui/Button';
import Badge, { badgeToneFor } from '@/components/ui/Badge';
import AdminPageHeader from '../_components/AdminPageHeader';
import {
  AdminEmptyState, AdminStatCard, AdminTableCard, EditIconLink, rowClass, thClass, theadClass,
} from '../_components/AdminTable';
import DeleteProjectButton from './_components/DeleteProjectButton';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const snap = await adminDb.collection('projects').orderBy('created_at', 'desc').get();
  const projects = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as {
    id: string;
    title: string;
    category: string;
    location: string | null;
    created_at: string;
  }[];

  const totalProjects = projects.length;
  const residentialCount = projects.filter((p) => p.category?.toLowerCase() === 'residential').length;
  const commercialCount = projects.filter((p) => p.category?.toLowerCase() === 'commercial').length;
  const agriculturalCount = projects.filter((p) => p.category?.toLowerCase() === 'agricultural').length;

  return (
    <div>
      <AdminPageHeader
        title="Projects"
        actions={
          <Button href="/admin/projects/new" size="sm">
            <Plus size={16} aria-hidden />
            New Project
          </Button>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <AdminStatCard number={totalProjects} label="Total Projects" />
        <AdminStatCard number={residentialCount} label="Residential" />
        <AdminStatCard number={commercialCount} label="Commercial" />
        <AdminStatCard number={agriculturalCount} label="Agricultural" />
      </div>

      {!projects.length ? (
        <AdminEmptyState title="No items yet" body="Get started by adding your first item." />
      ) : (
        /* Projects table */
        <AdminTableCard>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Title</th>
                <th className={thClass}>Location</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className={rowClass}>
                  {/* Title with avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {p.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-fg">{p.title}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-fg-subtle text-xs">{p.location ?? '—'}</td>

                  {/* Category badge */}
                  <td className="px-4 py-3">
                    {p.category ? (
                      <Badge tone={badgeToneFor(p.category)} className="capitalize">
                        {p.category}
                      </Badge>
                    ) : (
                      <span className="text-fg-subtle text-xs">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-fg-subtle whitespace-nowrap text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditIconLink href={`/admin/projects/${p.id}`} />
                      <DeleteProjectButton id={p.id} />
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
