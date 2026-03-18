import ReviewForm from '../_components/ReviewForm';
import { createReview } from '../actions';

export default function NewReviewPage() {
  return <ReviewForm action={createReview} />;
}
