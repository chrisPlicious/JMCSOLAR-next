'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Shared body for every admin `error.tsx` boundary. */
export default function AdminErrorState({
  title,
  error,
  reset,
}: {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-12 h-12 rounded-control bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="size-6 text-red-600" aria-hidden />
      </div>
      <h2 className="font-display font-bold text-fg text-lg mb-1">{title}</h2>
      <p className="text-fg-muted text-sm mb-6 max-w-xs">
        {error.message || 'Something went wrong fetching data from the database.'}
      </p>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
