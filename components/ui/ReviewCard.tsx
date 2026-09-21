import { Star } from 'lucide-react';
import type { Review } from '../../types';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ReviewCardProps {
  review: Review;
}

/** Dark review tile. Carries its own `surface-dark`, so it reads the same on any band. */
export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card
      variant="dark"
      padding="md"
      className="flex h-full flex-col gap-4 transition-colors duration-300 hover:border-white/15"
    >
      {/* Stars */}
      <div className="flex items-center gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star key={i} size={14} className="fill-solar-400 text-solar-400" aria-hidden />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="flex-1 text-sm text-fg-muted">&ldquo;{review.quote}&rdquo;</blockquote>

      {/* Author */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-solar-ink"
          >
            {review.name.charAt(0)}
          </span>
          <span className="truncate text-sm font-medium text-fg">{review.name}</span>
        </div>
        {review.source && (
          <Badge tone="on-dark" caps>
            {review.source}
          </Badge>
        )}
      </div>
    </Card>
  );
}
