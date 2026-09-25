// H1: Server component — receives pre-fetched reviews as props.
// No client Firebase SDK shipped to visitors; Firestore rules can now deny public reads.

import { Star, ThumbsUp } from 'lucide-react';
import ReviewCard from '@/components/ui/ReviewCard';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import type { Review } from '@/types';
import ReviewsClient from './ReviewsClient';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface ReviewsProps {
  reviews: Review[];
}

// One column on phones, two on tablets, three on desktop. Each breakpoint gets
// its own split so every review stays reachable instead of hiding whole columns.
const LAYOUTS = [
  { columns: 1, className: 'flex md:hidden' },
  { columns: 2, className: 'hidden md:flex lg:hidden' },
  { columns: 3, className: 'hidden lg:flex' },
] as const;

// Scroll speed is per card, so a long column isn't a blur; the offsets keep
// neighbouring columns out of step.
const SECONDS_PER_CARD = 6;
const COLUMN_PACE = [1, 1.2, 1.1];

// A column shorter than the 600px window shows a blank tail before it loops;
// three cards is the least that reliably fills it.
const MIN_CARDS_PER_COLUMN = 3;

/** Deal reviews round-robin so columns differ in length by at most one. */
function splitColumns(reviews: Review[], maxColumns: number) {
  const count = Math.max(1, Math.min(maxColumns, Math.floor(reviews.length / MIN_CARDS_PER_COLUMN)));
  return Array.from({ length: count }, (_, col) => reviews.filter((_, i) => i % count === col));
}

export default function Reviews({ reviews }: ReviewsProps) {
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

      {/* Scrolling columns, faded top and bottom */}
      {reviews.length > 0 ? (
        <div className="mb-10 max-h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] sm:mb-14">
          {LAYOUTS.map((layout) => (
            <div key={layout.columns} className={cn('justify-center gap-6', layout.className)}>
              {splitColumns(reviews, layout.columns).map((column, i) => (
                <TestimonialsColumn
                  key={i}
                  className="w-full max-w-[340px] min-w-0"
                  duration={column.length * SECONDS_PER_CARD * COLUMN_PACE[i]}
                >
                  {column.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </TestimonialsColumn>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-10 py-8 text-center text-sm text-fg-muted">No reviews yet.</p>
      )}

      {/* CTA — needs interactivity, delegate to client component */}
      <ReviewsClient />
    </Section>
  );
}
