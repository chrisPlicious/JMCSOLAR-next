import { Package, Plus } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AdminPageHeader from '../_components/AdminPageHeader';
import {
  AdminEmptyState, AdminStatCard, AdminTableCard, EditIconLink, rowClass, thClass, theadClass,
} from '../_components/AdminTable';
import DeleteProductButton from './_components/DeleteProductButton';

export const dynamic = 'force-dynamic';

const categoryTones: Record<string, 'solar' | 'success' | 'info' | 'neutral'> = {
  panels: 'solar',
  batteries: 'success',
  inverters: 'info',
  controllers: 'neutral',
  converters: 'neutral',
};

export default async function AdminProductsPage() {
  const snap = await adminDb.collection('products').orderBy('created_at', 'desc').get();
  const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as {
    id: string;
    name: string;
    brand: string | null;
    category: string;
    image_path: string | null;
  }[];
  const categoryData = products.map(p => ({ category: p.category }));

  const totalProducts = products?.length ?? 0;
  const distinctCategories = new Set(categoryData?.map((p) => p.category)).size;
  const panelsCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'panels').length ?? 0;
  const batteriesCount = categoryData?.filter((p) => p.category?.toLowerCase() === 'batteries').length ?? 0;

  return (
    <div>
      <AdminPageHeader
        title="Products"
        actions={
          <Button href="/admin/products/new" size="sm">
            <Plus size={16} aria-hidden />
            New Product
          </Button>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <AdminStatCard number={totalProducts} label="Total Products" />
        <AdminStatCard number={distinctCategories} label="Categories" />
        <AdminStatCard number={panelsCount} label="Panels" />
        <AdminStatCard number={batteriesCount} label="Batteries" />
      </div>

      {!products?.length ? (
        <AdminEmptyState title="No items yet" body="Get started by adding your first item." />
      ) : (
        /* Product table */
        <AdminTableCard>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Image</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Brand</th>
                <th className={thClass}>Category</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={rowClass}>
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {p.image_path ? (
                      <img
                        src={getPublicUrl(p.image_path)!}
                        alt={p.name}
                        className="w-10 h-10 rounded-md object-cover border border-line shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-500" aria-hidden />
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-medium text-fg">{p.name}</td>

                  {/* Brand */}
                  <td className="px-4 py-3 text-fg-subtle text-xs">{p.brand ?? '—'}</td>

                  {/* Category badge */}
                  <td className="px-4 py-3">
                    {p.category ? (
                      <Badge tone={categoryTones[p.category.toLowerCase()] ?? 'neutral'} className="capitalize">
                        {p.category}
                      </Badge>
                    ) : (
                      <span className="text-fg-subtle text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditIconLink href={`/admin/products/${p.id}`} />
                      <DeleteProductButton id={p.id} />
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
