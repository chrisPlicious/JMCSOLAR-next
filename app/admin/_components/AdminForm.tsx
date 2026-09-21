import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import AdminPageHeader from './AdminPageHeader';

/** Page header for create/edit screens: back link + AdminPageHeader. */
export function AdminFormHeader({
  title,
  backHref,
  description,
  actions,
}: {
  title: ReactNode;
  backHref: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Button href={backHref} variant="ghost" size="icon-sm" aria-label="Back" className="mt-0.5 shrink-0 text-slate-500">
        <ChevronLeft size={20} aria-hidden />
      </Button>
      <div className="min-w-0 flex-1">
        <AdminPageHeader title={title} description={description} actions={actions} />
      </div>
    </div>
  );
}

/** White card that holds an admin form. */
export function AdminFormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-card border border-line shadow-soft p-8 max-w-3xl', className)}>
      {children}
    </div>
  );
}

/** Labelled divider between groups of fields. */
export function FormSection({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 my-6', className)}>
      <span className="caps whitespace-nowrap">{title}</span>
      <hr className="flex-1 border-line" />
    </div>
  );
}

export function FormErrorBanner({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div role="alert" className={cn('mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-control px-4 py-3', className)}>
      {children}
    </div>
  );
}

/** Fixed save bar along the bottom of the main column (clears the 16rem sidebar). */
export function StickySaveBar({
  cancelHref,
  formId = 'main-form',
  pending,
  label,
}: {
  cancelHref: string;
  formId?: string;
  pending: boolean;
  label: string;
}) {
  return (
    <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-line shadow-soft px-8 py-4 flex items-center justify-end gap-3 z-30">
      <Button href={cancelHref} variant="ghost" size="sm">
        Cancel
      </Button>
      <Button type="submit" form={formId} size="sm" loading={pending}>
        {pending ? 'Saving…' : label}
      </Button>
    </div>
  );
}

/** Native file input styled to match the Field controls. */
export const fileInputClass =
  'w-full text-sm text-fg-subtle file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-solar-100 file:text-solar-ink file:font-semibold hover:file:bg-solar-200 file:cursor-pointer';
