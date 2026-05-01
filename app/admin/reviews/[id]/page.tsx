import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import type { DbReview } from '@/lib/firebase/types';
import ReviewForm from '../_components/ReviewForm';
import { updateReview } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await adminDb.collection('reviews').doc(id).get();
  const review = snap.exists ? ({ id: snap.id, ...snap.data() } as DbReview) : null;
  if (!review) notFound();

  const bound = updateReview.bind(null, id);
  return <ReviewForm review={review} action={bound} />;
}
