import { ArrowLeft, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import type { Service } from '@/data/services';
import Button from './Button';
import EmptyState from './EmptyState';
import PageHero from './PageHero';
import { Section } from './Section';

interface ServiceEmptyStateProps {
  service: Service;
}

export default function ServiceEmptyState({ service }: ServiceEmptyStateProps) {
  return (
    <Layout>
      <PageHero
        title={service.title}
        lead={service.description}
      />

      <Section tone="white" container="narrow">
        <EmptyState
          icon={Clock}
          title="Coming soon"
          body="This service page is coming soon. We're still preparing the details."
          action={
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/services" variant="outline">
                <ArrowLeft className="size-4" aria-hidden />
                Back to services
              </Button>
              <Button href={`/?service=${service.slug}#contact`}>Ask about this service</Button>
            </div>
          }
        />
      </Section>
    </Layout>
  );
}
