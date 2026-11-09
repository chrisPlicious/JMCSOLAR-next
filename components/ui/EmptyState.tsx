import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  /** Usually a Button that tells the visitor what to do next. */
  action?: ReactNode;
  className?: string;
}

/** Empty lists and "nothing here yet" pages: say what's missing and what to do. */
export default function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-card border border-dashed border-line bg-white px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-control bg-navy-50 text-navy-700">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h3 className="text-h3 text-fg">{title}</h3>
      {body && <p className="mx-auto mt-3 max-w-md text-fg-muted">{body}</p>}
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  );
}
