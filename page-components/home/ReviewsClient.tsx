'use client';

import { useState } from 'react';
import { ArrowRight, MessageSquarePlus } from 'lucide-react';
import ReviewSubmitDialog from './ReviewSubmitDialog';
import { Button } from '@/components/ui/Button';
import { FACEBOOK_REVIEWS_URL } from '@/lib/seo/site';

/** Client island: only the dialog-open button needs interactivity. */
export default function ReviewsClient() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Button onClick={() => setDialogOpen(true)}>
        <MessageSquarePlus size={16} aria-hidden />
        Share your experience
      </Button>
      <a
        href={FACEBOOK_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-solar-ink hover:underline"
      >
        See all reviews on Facebook
        <ArrowRight size={14} aria-hidden />
      </a>
      <ReviewSubmitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
