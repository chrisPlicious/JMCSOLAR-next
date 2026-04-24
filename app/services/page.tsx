import type { Metadata } from 'next';
import ServicesPage from '@/page-components/services/ServiceIndex';

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

export default function Services() {
  return <ServicesPage />;
}
