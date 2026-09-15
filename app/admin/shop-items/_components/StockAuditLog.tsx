import { adminDb } from '@/lib/firebase/admin';
import type { DbShopItem, DbStockAuditEntry, DbStockChangeReason } from '@/lib/firebase/types';

// #15 — stock history for one shop item.
//
// Query is a single equality filter, then sorted in memory: a `where` + `orderBy`
// pair would require a composite Firestore index, and this mirrors the existing
// convention in app/shop/page.tsx (filter in process, catalogue is small).

const MAX_ROWS = 50;

const REASON_LABELS: Record<DbStockChangeReason, string> = {
  sale: 'Sale',
  refund_restore: 'Refund — stock restored',
  cancel_restore: 'Cancelled — stock restored',
  manual_adjust: 'Manual adjustment',
  po_receive: 'Purchase order received',
  csv_import: 'CSV import',
};

const REASON_STYLES: Record<DbStockChangeReason, string> = {
  sale: 'text-blue-700 bg-blue-50 border-blue-200',
  refund_restore: 'text-purple-700 bg-purple-50 border-purple-200',
  cancel_restore: 'text-purple-700 bg-purple-50 border-purple-200',
  manual_adjust: 'text-amber-700 bg-amber-50 border-amber-200',
  po_receive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  csv_import: 'text-slate-600 bg-slate-50 border-slate-200',
};

async function getAuditRows(shopItemId: string): Promise<DbStockAuditEntry[]> {
  const snap = await adminDb
    .collection('stockAudit')
    .where('shop_item_id', '==', shopItemId)
    .get();

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DbStockAuditEntry, 'id'>) }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, MAX_ROWS);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function StockAuditLog({ item }: { item: DbShopItem }) {
  let rows: DbStockAuditEntry[] = [];
  let failed = false;
  try {
    rows = await getAuditRows(item.id);
  } catch (e) {
    console.error('[StockAuditLog]', e);
    failed = true;
  }

  const variantLabel = (variantId: string | null): string => {
    if (!variantId) return '—';
    return item.variants?.find((v) => v.id === variantId)?.label ?? variantId;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 mt-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Stock history
        </p>
        {rows.length > 0 && (
          <p className="text-xs text-slate-400">
            Showing {rows.length}
            {rows.length === MAX_ROWS ? ` most recent` : ''}
          </p>
        )}
      </div>

      {failed ? (
        <p className="text-sm text-slate-500">
          Could not load stock history. The item itself is unaffected.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No stock movements recorded yet. Sales, refunds and adjustments will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm min-w-[34rem]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">
                  When
                </th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">
                  Reason
                </th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">
                  Variant
                </th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-right">
                  Change
                </th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-right">
                  Stock after
                </th>
                <th className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 text-left">
                  By
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        REASON_STYLES[r.reason] ?? 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}
                    >
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{variantLabel(r.variant_id)}</td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold tabular-nums ${
                      r.delta < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {r.delta > 0 ? `+${r.delta}` : r.delta}
                  </td>
                  <td className="px-3 py-2.5 text-right text-navy-900 font-medium tabular-nums">
                    {r.stock_after}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{r.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3">
        Every stock movement is recorded here — sales, refund restores, and future
        adjustments. Rows are written atomically with the stock change, so this log and
        the stock count above can never disagree.
      </p>
    </div>
  );
}
