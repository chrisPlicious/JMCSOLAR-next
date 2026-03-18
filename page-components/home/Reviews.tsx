'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import ReviewCard from '@/components/ui/ReviewCard';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import type { DbReview } from '@/lib/supabase/types';
import type { Review } from '@/types';

function toReviewCardData(r: DbReview): Review {
  return {
    id: r.id,
    name: r.reviewer_name,
    rating: r.rating,
    quote: r.quote,
    source: r.source as Review['source'],
  };
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReviews((data as DbReview[]).map(toReviewCardData));
      });
  }, []);

  const mid = Math.ceil(reviews.length / 2);
  const topReviews = reviews.slice(0, mid);
  const bottomReviews = reviews.slice(mid);

  return (
    <section id="reviews" className="relative py-24 bg-navy-900 overflow-hidden">
      {/* Custom Keyframes for Marquee */}
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
        `}
      </style>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-solar-500/20 to-transparent" />
      <div className="absolute -top-40 right-20 w-80 h-80 bg-solar-500/5 blob-shape pointer-events-none" />
      <div className="absolute bottom-20 -left-20 w-60 h-60 bg-navy-700/30 blob-shape-2 pointer-events-none" />

      {/* SINGLE UNIFIED CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-solar-400 font-semibold text-sm uppercase tracking-widest mb-5">
            <span className="w-8 h-px bg-solar-500/50" />
            Customer Reviews
            <span className="w-8 h-px bg-solar-500/50" />
          </span>
          <h2
            className="text-white font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            What Our <span className="text-solar-400">Customers</span> Say
          </h2>

          {/* Overall Rating Badge */}
          <div className="inline-flex flex-wrap justify-center items-center gap-3 sm:gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full px-6 py-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} className="text-solar-400 fill-solar-400" />
              ))}
            </div>
            <div className="border-l border-white/10 pl-4 text-left">
              <div className="text-white font-black text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                100%
              </div>
              <div className="text-white/40 text-xs">Recommend Rate</div>
            </div>
            <div className="border-l border-white/10 pl-4 flex items-center gap-2">
              <ThumbsUp size={16} className="text-green-eco" />
              <div>
                <div className="text-white font-bold text-base">{reviews.length}</div>
                <div className="text-white/40 text-xs">Reviews</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marquee Section */}
        {reviews.length > 0 && (
          <div className="group/wall flex flex-col gap-6 w-full mb-14 overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">

            {/* Row 1: Scrolling Left */}
            {topReviews.length > 0 && (
              <div className="flex w-max relative z-[1] py-4 -my-4 transition-[z-index] duration-0 hover:z-50 group-hover/wall:[animation-play-state:paused] animate-[scroll-left_40s_linear_infinite]">
                <div className="flex gap-5 pr-5">
                  {topReviews.map((review) => (
                    <div key={review.id} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 pr-5" aria-hidden="true">
                  {topReviews.map((review) => (
                    <div key={`dup-${review.id}`} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Scrolling Right */}
            {bottomReviews.length > 0 && (
              <div className="flex w-max relative z-[1] py-4 -my-4 transition-[z-index] duration-0 hover:z-50 group-hover/wall:[animation-play-state:paused] animate-[scroll-right_40s_linear_infinite]">
                <div className="flex gap-5 pr-5">
                  {bottomReviews.map((review) => (
                    <div key={review.id} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 pr-5" aria-hidden="true">
                  {bottomReviews.map((review) => (
                    <div key={`dup-${review.id}`} className="w-[280px] sm:w-[340px] shrink-0 transition-transform duration-300 hover:-translate-y-2">
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <a
            href="https://www.facebook.com/jmcsolar/reviews/?id=100063736463795&sk=reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/40 hover:text-solar-400 transition-colors text-sm font-medium"
          >
            <span>See all reviews on Facebook</span>
            <span className="text-solar-500">→</span>
          </a>
        </div>

      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-solar-500/20 to-transparent" />
    </section>
  );
}
