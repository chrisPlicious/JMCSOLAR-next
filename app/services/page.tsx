import type { Metadata } from 'next';
import ServicesPage from '@/page-components/services/ServiceIndex';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { getServices } from '@/lib/data/getServices';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Solar Services',
  description:
    'Explore JMC Solar PH services: hybrid solar systems, on-grid installations, battery storage, EV chargers, and more in Ormoc City, Leyte.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Solar Services | JMC Solar PH',
    description:
      'Hybrid solar, on-grid, battery storage, EV chargers, and more. Professional solar installation services in Ormoc City, Leyte.',
  },
};

const breadcrumb = makeBreadcrumbLd([
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services' },
]);

export default async function Services() {
  const services = await getServices();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ServicesPage services={services} />
    </>
  );
}
