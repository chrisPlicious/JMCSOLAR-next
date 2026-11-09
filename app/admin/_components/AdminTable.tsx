import type { ReactNode } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small stat tile used in the strip above each admin list. */
export function AdminStatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-white rounded-card border border-line shadow-soft p-4">
      <p className="font-display text-2xl font-black tabular-nums text-fg leading-none">{number}</p>
      <p className="caps mt-1">{label}</p>
    </div>
  );
}

/** White card that wraps an admin table or its empty state. */
export function AdminTableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-card border border-line overflow-hidden shadow-soft', className)}>
      {children}
    </div>
  );
}

export function AdminEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <AdminTableCard>
      <div className="text-center py-16 px-4">
        <div className="w-12 h-12 rounded-control bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Plus className="size-6 text-slate-500" aria-hidden />
        </div>
        <p className="text-fg font-medium text-sm mb-1">{title}</p>
        <p className="text-fg-subtle text-xs">{body}</p>
      </div>
    </AdminTableCard>
  );
}

export const theadClass = 'bg-slate-50 border-b border-line';
export const thClass = 'caps px-4 py-3 text-left';
export const rowClass =
  'border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-solar-50 transition-colors duration-150';

/** Icon-only edit link for table rows. */
export function EditIconLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Edit"
      title="Edit"
      className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:text-fg hover:bg-slate-100 transition-colors"
    >
      <Pencil size={16} aria-hidden />
    </Link>
  );
}
