import type { Metadata } from 'next';
import { Compass } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PageHero from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Layout>
      <PageHero
        size="compact"
        title="Page not found"
        lead="The link you followed may be old or mistyped, or the page has moved."
      />
      <Section tone="white" container="prose">
        <EmptyState
          icon={Compass}
          title="Let's get you back on track"
          body="Head to the homepage, or browse the solar services we offer."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/">Go to homepage</Button>
              <Button href="/services" variant="outline">
                See our services
              </Button>
            </div>
          }
        />
      </Section>
    </Layout>
  );
}
