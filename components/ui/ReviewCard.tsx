import type { Review } from '../../types';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
  className?: string;
}

// Brand marks keep their own colours, so they live as assets rather than tokens.
const SOURCE_LOGO: Record<Review['source'], string> = {
  Facebook: '/Logos/review-facebook.svg',
  Google: '/Logos/review-google.svg',
};

/** Dark review tile. Carries its own `surface-dark`, so it reads the same on any band. */
export default function ReviewCard({ review, className }: ReviewCardProps) {
  // Firestore values are cast, not checked; fall back to the reviewer's initial.
  const logo = SOURCE_LOGO[review.source] as string | undefined;

  return (
    <Card as="figure" variant="dark" padding="md" className={cn('flex h-full flex-col gap-5', className)}>
      <blockquote className="flex-1 text-sm leading-relaxed text-fg-muted">&ldquo;{review.quote}&rdquo;</blockquote>

      <figcaption className="flex items-center gap-3">
        {/* Decorative: the pill below already names the source. */}
        {logo ? (
          <img
            src={logo}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="size-10 shrink-0 rounded-full"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-solar-ink"
          >
            {review.name.charAt(0)}
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="truncate text-sm font-medium leading-5 text-fg">{review.name}</span>
          {review.source && (
            <Badge tone="on-dark" caps>
              {review.source}
            </Badge>
          )}
        </div>
      </figcaption>
    </Card>
  );
}
