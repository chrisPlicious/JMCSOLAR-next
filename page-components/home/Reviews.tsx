// H1: Server component — receives pre-fetched reviews as props.
// No client Firebase SDK shipped to visitors; Firestore rules can now deny public reads.

import { Star, ThumbsUp } from 'lucide-react';
import ReviewCard from '@/components/ui/ReviewCard';
import type { Review } from '@/types';
import ReviewsClient from './ReviewsClient';
import SmoothMarquee from '@/components/ui/SmoothMarquee';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface ReviewsProps {
  reviews: Review[];
}

function ReviewRow({ reviews, duplicate = false }: { reviews: Review[]; duplicate?: boolean }) {
  return (
    <div className="flex gap-3 pr-3 sm:gap-5 sm:pr-5" aria-hidden={duplicate || undefined}>
      {reviews.map((review) => (
        <div
          key={duplicate ? `dup-${review.id}` : review.id}
          className="w-70 shrink-0 transition-transform duration-300 ease-out-quart hover:-translate-y-1 sm:w-85"
        >
          <ReviewCard review={review} />
        </div>
      ))}
    </div>
  );
}

export default function Reviews({ reviews }: ReviewsProps) {
  const mid = Math.ceil(reviews.length / 2);
  const topReviews = reviews.slice(0, mid);
  const bottomReviews = reviews.slice(mid);

  return (
    <Section id="reviews" tone="dark" className="overflow-hidden">
      <SectionHeader
        align="center"
        className="mb-6 sm:mb-8"
        title={
          <>
            What Our <span className="text-solar-ink">Customers</span> Say
          </>
        }
      />

      {/* Overall rating summary */}
      <div className="mb-10 flex justify-center sm:mb-14">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-line bg-white/5 px-5 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex items-center gap-1" role="img" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-solar-400 text-solar-400" aria-hidden />
            ))}
          </div>
          <div className="border-l border-line pl-3 text-left sm:pl-4">
            <div className="font-display text-lg font-extrabold text-fg tabular-nums">100%</div>
            <div className="text-xs text-fg-subtle">Recommend Rate</div>
          </div>
          <div className="flex items-center gap-2 border-l border-line pl-3 sm:pl-4">
            <ThumbsUp size={16} className="text-green-eco" aria-hidden />
            <div>
              <div className="text-base font-bold text-fg tabular-nums">{reviews.length}</div>
              <div className="text-xs text-fg-subtle">Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee rows (keyframes live in globals.css: .marquee-left / .marquee-right) */}
      {reviews.length > 0 ? (
        <div className="relative mb-10 flex w-full flex-col gap-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] sm:mb-14 sm:gap-6 sm:[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          {topReviews.length > 0 && (
            <SmoothMarquee direction="left">
              <ReviewRow reviews={topReviews} />
              <ReviewRow reviews={topReviews} duplicate />
            </SmoothMarquee>
          )}

          {bottomReviews.length > 0 && (
            <SmoothMarquee direction="right">
              <ReviewRow reviews={bottomReviews} />
              <ReviewRow reviews={bottomReviews} duplicate />
            </SmoothMarquee>
          )}
        </div>
      ) : (
        <p className="mb-10 py-8 text-center text-sm text-fg-muted">No reviews yet.</p>
      )}

      {/* CTA — needs interactivity, delegate to client component */}
      <ReviewsClient />
    </Section>
  );
}
