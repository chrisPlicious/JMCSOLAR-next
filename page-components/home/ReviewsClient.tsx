'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import ReviewSubmitDialog from './ReviewSubmitDialog';

/** Client island: only the dialog-open button needs interactivity. */
export default function ReviewsClient() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="text-center flex flex-col items-center gap-4">
      <button
        onClick={() => setDialogOpen(true)}
        className="inline-flex items-center gap-2 bg-solar-500 hover:bg-solar-400 text-navy-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
      >
        <MessageSquarePlus size={16} />
        Share Your Experience
      </button>
      <a
        href="https://www.facebook.com/jmcsolar/reviews/?id=100063736463795&sk=reviews"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-white/40 hover:text-solar-400 transition-colors text-xs sm:text-sm font-medium"
      >
        <span>See all reviews on Facebook</span>
        <span className="text-solar-500">→</span>
      </a>
      <ReviewSubmitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
