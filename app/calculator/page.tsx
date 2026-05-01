import type { Metadata } from 'next';
import SolarCalculator from '@/page-components/calculator/SolarCalculator';

export const metadata: Metadata = {
  title: 'Solar Savings Calculator | JMC Solar',
  description:
    'Estimate your solar savings based on your monthly electric bill or kWh usage. See recommended system size, payback period, and 25-year savings projection for your region in the Philippines.',
};

export default function CalculatorPage() {
  return <SolarCalculator />;
}
