'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'jmc:loader-seen';

/**
 * Hides children on a fresh session visit until LoaderScreen dispatches
 * `jmc:loader-done`, so mount animations don't play behind the loader.
 * On repeat visits within the same session, renders children immediately.
 */
export default function LoaderGate({ children }: { children: React.ReactNode }) {
  // Match SSR: render children initially. We flip this off on the client if
  // this is a fresh session visit.
  const [ready, setReady] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // sessionStorage may be unavailable (privacy mode) — treat as seen so we
      // don't block content indefinitely.
      seen = true;
    }

    if (seen) return;

    setReady(false);

    const onDone = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // ignore
      }
      setReady(true);
    };

    window.addEventListener('jmc:loader-done', onDone);
    return () => window.removeEventListener('jmc:loader-done', onDone);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
