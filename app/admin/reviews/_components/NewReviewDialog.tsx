'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Field';
import { createReviewFromDialog } from '../actions';

const SOURCE_OPTIONS = ['google', 'facebook', 'instagram', 'direct', 'other'] as const;

export default function NewReviewDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState<number | null>(null);
  const [state, dispatch, isPending] = useActionState(createReviewFromDialog, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isPending) {
      if (state === null) {
        submitted.current = false;
        toast.success('Review added successfully');
        setOpen(false);
        setRating(5);
        formRef.current?.reset();
        router.refresh();
      } else if (state?.error) {
        toast.error(state.error);
      }
    }
  }, [state, isPending, router]);

  function handleSubmit() {
    submitted.current = true;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: 'sm' })}>
        <Plus size={16} aria-hidden />
        New Review
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-line">
          <DialogTitle>New Review</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={dispatch} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-control px-4 py-3">
              {state.error}
            </div>
          )}

          <Field id="new-review-name" label="Reviewer Name" required>
            <Input name="reviewer_name" />
          </Field>

          <Field id="new-review-source" label="Source" required>
            <Select name="source" defaultValue="google">
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <Label required>Rating</Label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hovered ?? rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setRating(star)}
                    className="p-0.5 rounded-sm transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <Star
                      size={26}
                      strokeWidth={1.5}
                      fill={filled ? 'currentColor' : 'none'}
                      className={filled ? 'text-solar-500' : 'text-slate-500'}
                      aria-hidden
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-fg-subtle">{rating} / 5</span>
            </div>
            <input type="hidden" name="rating" value={rating} />
          </div>

          <Field id="new-review-quote" label="Quote" required>
            <Textarea name="quote" rows={3} />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isPending}>
              {isPending ? 'Saving…' : 'Create Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
