// H1: Server component — receives pre-fetched reviews as props.
// No client Firebase SDK shipped to visitors; Firestore rules can now deny public reads.

import { Star, ThumbsUp, MessageSquarePlus } from 'lucide-react';
import ReviewCard from '@/components/ui/ReviewCard';
import type { Review } from '@/types';
import ReviewsClient from './ReviewsClient';
import SmoothMarquee from '@/components/ui/SmoothMarquee';

interface ReviewsProps {
  reviews: Review[];
}

export default function Reviews({ reviews }: ReviewsProps) {
  const mid = Math.ceil(reviews.length / 2);
  const topReviews = reviews.slice(0, mid);
  const bottomReviews = reviews.slice(mid);

  return (
    <section id="reviews" className="relative py-16 sm:py-20 lg:py-24 bg-navy-900 overflow-hidden">
      {/* Keyframes for marquee rows */}
      <style>
        {`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scroll-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .marquee-left {
            animation: scroll-left 25s linear infinite;
          }
          .marquee-right {
            animation: scroll-right 25s linear infinite;
          }
          @media (min-width: 640px) {
            .marquee-left,
            .marquee-right {
              animation-duration: 40s;
            }
          }
        `}
      </style>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-solar-500/20 to-transparent" />

      {/* SINGLE UNIFIED CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 text-solar-400 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5">
            <span className="w-6 sm:w-8 h-px bg-solar-500/50" />
            Customer Reviews
            <span className="w-6 sm:w-8 h-px bg-solar-500/50" />
          </span>
          <h2
            className="text-white font-black text-2xl sm:text-4xl lg:text-5xl leading-tight mb-6 sm:mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            What Our <span className="text-solar-400">Customers</span> Say
          </h2>

          {/* Overall Rating Badge */}
          <div className="inline-flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className="text-solar-400 fill-solar-400 sm:[&]:w-[18px] sm:[&]:h-[18px]" />
              ))}
            </div>
            <div className="border-l border-white/10 pl-3 sm:pl-4 text-left">
              <div className="text-white font-black text-base sm:text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                100%
              </div>
              <div className="text-white/40 text-[10px] sm:text-xs">Recommend Rate</div>
            </div>
            <div className="border-l border-white/10 pl-3 sm:pl-4 flex items-center gap-1.5 sm:gap-2">
              <ThumbsUp size={14} className="text-green-eco sm:[&]:w-4 sm:[&]:h-4" />
              <div>
                <div className="text-white font-bold text-sm sm:text-base">{reviews.length}</div>
                <div className="text-white/40 text-[10px] sm:text-xs">Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee Section */}
        {reviews.length > 0 && (
          <div className="flex flex-col gap-4 sm:gap-6 w-full mb-10 sm:mb-14 overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">

            {/* Row 1: Scrolling Left */}
            {topReviews.length > 0 && (
              <SmoothMarquee direction="left">
                <div className="flex gap-3 sm:gap-5 pr-3 sm:pr-5 mt-2">
                  {topReviews.map((review) => (
                    <div key={review.id} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-0.5">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 sm:gap-5 pr-3 sm:pr-5 mt-2" aria-hidden="true">
                  {topReviews.map((review) => (
                    <div key={`dup-${review.id}`} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-0.5">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </SmoothMarquee>
            )}

            {/* Row 2: Scrolling Right */}
            {bottomReviews.length > 0 && (
              <SmoothMarquee direction="right">
                <div className="flex gap-3 sm:gap-5 pr-3 sm:pr-5">
                  {bottomReviews.map((review) => (
                    <div key={review.id} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 sm:gap-5 pr-3 sm:pr-5" aria-hidden="true">
                  {bottomReviews.map((review) => (
                    <div key={`dup-${review.id}`} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </SmoothMarquee>
            )}

            {/* empty-state fallback */}
            {reviews.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8">No reviews yet.</p>
            )}
          </div>
        )}

        {/* CTA Section — needs interactivity, delegate to client component */}
        <ReviewsClient />

      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-solar-500/20 to-transparent" />
    </section>
  );
}
