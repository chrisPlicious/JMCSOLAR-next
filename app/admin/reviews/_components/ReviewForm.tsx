'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import type { DbReview } from '@/lib/firebase/types';
import { LOCATIONS } from '@/data/locations';
import Badge from '@/components/ui/Badge';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormSection, StickySaveBar,
} from '../../_components/AdminForm';

const SOURCE_OPTIONS = ['google', 'facebook', 'instagram', 'direct', 'other'] as const;

type ReviewFormProps = {
  review?: DbReview;
  action: (fd: FormData) => Promise<void>;
};

export default function ReviewForm({ review, action }: ReviewFormProps) {
  const isEdit = Boolean(review);
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      <AdminFormHeader title={isEdit ? 'Edit Review' : 'New Review'} backHref="/admin/reviews" />

      <AdminFormCard className="mb-24">
        <form id="main-form" action={action} className="space-y-5">
          <FormSection title="Review Info" />

          {isEdit && review?.status && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-fg">Current Status:</span>
              <Badge
                tone={review.status === 'pending' ? 'solar' : review.status === 'rejected' ? 'danger' : 'success'}
                className="capitalize"
              >
                {review.status}
              </Badge>
            </div>
          )}

          {isEdit && (
            <Field id="review-status" label="Status">
              <Select name="status" defaultValue={review?.status ?? 'approved'}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          )}

          <Field id="review-name" label="Reviewer Name" required>
            <Input name="reviewer_name" defaultValue={review?.reviewer_name ?? ''} />
          </Field>

          <Field id="review-source" label="Source" required>
            <Select name="source" defaultValue={review?.source ?? 'google'}>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
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
                      size={28}
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

          <Field id="review-city" label="City / Area">
            <Select name="city_slug" defaultValue={review?.city_slug ?? ''}>
              <option value="">Other / unlisted</option>
              {LOCATIONS.filter((l) => l.tier === 'municipality').map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}{loc.province ? ` — ${loc.province}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="review-quote" label="Quote" required>
            <Textarea name="quote" rows={4} defaultValue={review?.quote ?? ''} />
          </Field>
        </form>
      </AdminFormCard>

      <StickySaveBar
        cancelHref="/admin/reviews"
        pending={false}
        label={isEdit ? 'Update Review' : 'Create Review'}
      />
    </>
  );
}
