'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProductAction } from '../actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar, fileInputClass,
} from '../../_components/AdminForm';

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default function NewProductForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProductAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success('Product created successfully');
      router.push('/admin/products');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <>
      <AdminFormHeader title="New Product" backHref="/admin/products" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-5">
          <FormSection title="Basic Information" />

          <Field id="product-name" label="Name" required>
            <Input name="name" />
          </Field>
          <Field id="product-brand" label="Brand">
            <Input name="brand" />
          </Field>

          <FormSection title="Classification" />

          <Field id="product-category" label="Category" required>
            <Select name="category">
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="product-related-service" label="Related Service">
            <Select name="related_service">
              <option value="">None</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <FormSection title="Details" />

          <Field id="product-specs" label="Specs">
            <Input name="specs" placeholder="e.g. 550W · Mono PERC" />
          </Field>
          <Field id="product-description" label="Description">
            <Textarea name="description" rows={4} />
          </Field>
          <Field id="product-badge" label="Badge">
            <Input name="badge" placeholder="e.g. Best Seller" />
          </Field>

          <FormSection title="Media" />

          <Field id="product-image" label="Product Image">
            <input name="image" type="file" accept="image/*" className={fileInputClass} />
          </Field>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/products" pending={isPending} label="Create Product" />
    </>
  );
}
