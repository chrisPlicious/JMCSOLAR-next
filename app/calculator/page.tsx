import type { Metadata } from 'next';
import SolarCalculator from '@/page-components/calculator/SolarCalculator';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';

export const metadata: Metadata = {
  title: 'Solar Savings Calculator | JMC Solar',
  description:
    'Estimate your solar savings based on your monthly electric bill or kWh usage. See recommended system size, payback period, and 25-year savings projection for your region in the Philippines.',
  alternates: { canonical: '/calculator' },
};

const breadcrumb = makeBreadcrumbLd([
  { name: 'Home', url: '/' },
  { name: 'Solar Savings Calculator', url: '/calculator' },
]);

export default function CalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <SolarCalculator />
    </>
  );
}
