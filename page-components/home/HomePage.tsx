import { Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from './Hero';
import About from './About';
import Partners from './Partners';
import Reviews from './Reviews';
import Contact from './Contact';
import type { Review } from '@/types';

interface HomePageProps {
  reviews: Review[];
}

export default function HomePage({ reviews }: HomePageProps) {
  return (
    <Layout>
      <Hero />
      <About />
      <Partners />
      <Reviews reviews={reviews} />
      {/* L1: fallback skeleton so Suspense boundary renders something */}
      <Suspense fallback={<div className="py-24 bg-white" aria-hidden="true" />}>
        <Contact />
      </Suspense>
    </Layout>
  );
}
