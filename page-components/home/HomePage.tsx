import { Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from './Hero';
import About from './About';
import Partners from './Partners';
import Reviews from './Reviews';
import Contact from './Contact';
import ServiceHighlights from './ServiceHighlights';
import type { Review } from '@/types';
import type { Service } from '@/data/services';

interface HomePageProps {
  reviews: Review[];
  services: Service[];
}

export default function HomePage({ reviews, services }: HomePageProps) {
  return (
    <Layout>
      <Hero />
      <About />
      <ServiceHighlights services={services} />
      <Partners />
      <Reviews reviews={reviews} />
      {/* L1: fallback skeleton so Suspense boundary renders something */}
      <Suspense fallback={<div className="py-24 bg-white" aria-hidden="true" />}>
        <Contact />
      </Suspense>
    </Layout>
  );
}
