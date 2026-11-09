'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createResultAction } from '../actions';
import SingleImageUploader from './SingleImageUploader';
import { Field, Label, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar,
} from '../../_components/AdminForm';

export default function NewResultForm() {
  const [state, formAction, isPending] = useActionState(createResultAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success('Result created successfully');
      router.push('/admin/results');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <AdminFormHeader title="New Result" backHref="/admin/results" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-6">
          <FormSection title="Content" />

          <Field id="description" label="Description" required>
            <Textarea
              name="description"
              rows={4}
              placeholder="E.g., This customer switched to solar and saw a significant reduction in their monthly electric bill..."
              className="resize-y"
            />
          </Field>

          <FormSection title="Bill Photos" />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Before</Label>
              <p className="text-xs text-fg-subtle mb-3">Upload the old electric bill photo</p>
              <SingleImageUploader name="before_image" />
            </div>
            <div>
              <Label>After</Label>
              <p className="text-xs text-fg-subtle mb-3">Upload the new electric bill photo</p>
              <SingleImageUploader name="after_image" />
            </div>
          </div>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/results" pending={isPending} label="Create Result" />
    </div>
  );
}
