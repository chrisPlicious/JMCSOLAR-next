import type { Metadata } from 'next';
import SolarCalculator from '@/page-components/calculator/SolarCalculator';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Solar Savings Calculator',
  description:
    'Estimate your solar savings based on your monthly electric bill or kWh usage. See recommended system size, payback period, and 25-year savings projection for your region in the Philippines.',
  path: '/calculator',
});

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
