import type { Metadata } from 'next';
import ResultsIndex from '@/page-components/results/ResultsIndex';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { BillResult } from '@/types';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';

export const metadata: Metadata = {
  title: 'Real Results',
  description:
    'See real before and after electric bill photos from JMC Solar PH customers across Leyte and Visayas. Proof that solar energy reduces electricity costs.',
  alternates: { canonical: '/results' },
  openGraph: {
    title: 'Real Results | JMC Solar PH',
    description:
      'Before and after electric bill comparisons from real JMC Solar customers. See how much they save every month.',
  },
};

export default async function ResultsPage() {
  const snap = await adminDb.collection('results').orderBy('display_order', 'asc').get();

  const results = snap.docs.map((doc) => {
    const data = doc.data() as Omit<BillResult, 'id'>;
    return {
      id: doc.id,
      ...data,
      beforeUrl: getPublicUrl(data.before_image_path) ?? data.before_image_path,
      afterUrl: getPublicUrl(data.after_image_path) ?? data.after_image_path,
    };
  });

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Real Results', url: '/results' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ResultsIndex results={results} />
    </>
  );
}
