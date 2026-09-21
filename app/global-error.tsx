'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import './globals.css';

/**
 * Last-resort boundary for errors in the root layout (or in the Navbar/Footer
 * that app/error.tsx itself renders). It replaces the whole document, so it
 * stays self-contained: no site Layout, no data, no motion.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="surface-dark grid min-h-screen place-items-center bg-navy-950 px-6 font-sans">
        <main className="max-w-md text-center">
          <p className="font-wordmark text-xl text-fg">
            <span className="font-extrabold">JMC</span> <span className="font-medium text-fg-muted">SOLAR</span>
          </p>
          <h1 className="mt-8 text-h2 text-fg">Something went wrong</h1>
          <p className="mt-4 text-fg-muted">
            The page failed to load. Try again, or come back in a few minutes.
          </p>
          {error.digest && <p className="mt-3 text-sm text-fg-subtle">Error reference: {error.digest}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            {/* Full reload on purpose: the app shell may be what failed. */}
            <Button variant="outline-dark" onClick={() => window.location.assign('/')}>
              Go to homepage
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
