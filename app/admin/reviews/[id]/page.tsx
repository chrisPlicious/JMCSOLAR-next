import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ReviewForm from '../_components/ReviewForm';
import { updateReview } from '../actions';

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: review } = await supabase.from('reviews').select('*').eq('id', id).single();
  if (!review) notFound();

  const bound = updateReview.bind(null, id);
  return <ReviewForm review={review} action={bound} />;
}
