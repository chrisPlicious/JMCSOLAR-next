import { Star } from 'lucide-react';
import type { Review } from '../../types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-linear-to-br from-navy-800 to-navy-900 rounded-3xl p-6 flex flex-col gap-4 border border-white/6 hover:border-solar-500/20 transition-all duration-300">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star key={i} size={14} className="text-solar-400 fill-solar-400" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-white/70 text-sm leading-relaxed flex-1">
        &ldquo;{review.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center justify-between pt-2 border-t border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-br from-solar-500/30 to-solar-600/10 rounded-full flex items-center justify-center text-solar-400 font-bold text-sm">
            {review.name.charAt(0)}
          </div>
          <span className="text-white/90 font-medium text-sm">{review.name}</span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
          review.source === 'Google'
            ? 'bg-white/6 text-white/50'
            : 'bg-blue-500/15 text-blue-300/80'
        }`}>
          {review.source}
        </span>
      </div>
    </div>
  );
}
