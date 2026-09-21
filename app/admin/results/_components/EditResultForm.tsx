'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateResultAction } from '../actions';
import SingleImageUploader from './SingleImageUploader';
import type { BillResult } from '@/types';
import { Field, Label, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar,
} from '../../_components/AdminForm';

interface Props {
  result: BillResult;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

export default function EditResultForm({ result, beforeImageUrl, afterImageUrl }: Props) {
  const boundAction = updateResultAction.bind(null, result.id);
  const [state, formAction, isPending] = useActionState(boundAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success('Result updated');
      router.push('/admin/results');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <AdminFormHeader title="Edit Result" backHref="/admin/results" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-6">
          <input type="hidden" name="existing_before_path" value={result.before_image_path} />
          <input type="hidden" name="existing_after_path" value={result.after_image_path} />

          <FormSection title="Content" />

          <Field id="description" label="Description" required>
            <Textarea
              name="description"
              rows={4}
              defaultValue={result.description || ''}
              placeholder="E.g., This customer switched to solar and saw a significant reduction in their monthly electric bill..."
              className="resize-y"
            />
          </Field>

          <FormSection title="Bill Photos" />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Before</Label>
              <p className="text-xs text-fg-subtle mb-3">Hover image to replace</p>
              <SingleImageUploader name="before_image" currentUrl={beforeImageUrl} />
            </div>
            <div>
              <Label>After</Label>
              <p className="text-xs text-fg-subtle mb-3">Hover image to replace</p>
              <SingleImageUploader name="after_image" currentUrl={afterImageUrl} />
            </div>
          </div>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/results" pending={isPending} label="Save Changes" />
    </div>
  );
}
