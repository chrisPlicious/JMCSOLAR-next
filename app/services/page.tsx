import type { Metadata } from 'next';
import ServicesPage from '@/page-components/services/ServiceIndex';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { pageMetadata } from '@/lib/seo/metadata';
import { SERVICE_AREA } from '@/lib/seo/business';
import { getServices } from '@/data/services';

export const metadata: Metadata = pageMetadata({
  title: 'Solar Services',
  description:
    `Explore JMC Solar PH services: hybrid solar systems, on-grid installations, battery storage, EV chargers, and more across ${SERVICE_AREA}.`,
  path: '/services',
});

const breadcrumb = makeBreadcrumbLd([
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services' },
]);

export default function Services() {
  const services = getServices();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ServicesPage services={services} />
    </>
  );
}
