'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

/**
 * Public error boundary. Layout (Navbar + Footer) is client-safe, so visitors
 * keep the site navigation even when a page fails to render.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.digest ? `[app error] digest ${error.digest}` : '[app error]', error);
  }, [error]);

  return (
    <Layout>
      <PageHero
        size="compact"
        title="Something went wrong"
        lead="This page couldn't load just now. Please try again — if it keeps happening, head back to the homepage."
        actions={
          <>
            <Button onClick={reset}>
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </Button>
            <Button href="/" variant="outline-dark">
              Go to homepage
            </Button>
          </>
        }
      />
      {error.digest && (
        <Section tone="white" spacing="compact">
          <p className="text-sm text-fg-subtle">
            Error reference: <span className="font-mono tabular-nums">{error.digest}</span>
          </p>
        </Section>
      )}
    </Layout>
  );
}
