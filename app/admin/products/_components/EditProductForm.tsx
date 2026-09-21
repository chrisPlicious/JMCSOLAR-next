'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProductAction } from '../actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar, fileInputClass,
} from '../../_components/AdminForm';

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  specs: string | null;
  description: string | null;
  badge: string | null;
  related_service: string | null;
  image_path: string | null;
};

const categories = ['panels', 'batteries', 'inverters', 'controllers', 'converters'];
const services = ['hybrid', 'ongrid', 'bess', 'pump', 'ev', 'ups', 'controller'];

export default function EditProductForm({
  product,
  imageUrl,
}: {
  product: Product;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const updateWithId = updateProductAction.bind(null, product.id);
  const [state, formAction, isPending] = useActionState(updateWithId, {});

  useEffect(() => {
    if (state?.success) {
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <>
      <AdminFormHeader title="Edit Product" backHref="/admin/products" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-5">
          <FormSection title="Basic Information" />

          <Field id="product-name" label="Name" required>
            <Input name="name" defaultValue={product.name} />
          </Field>
          <Field id="product-brand" label="Brand">
            <Input name="brand" defaultValue={product.brand ?? ''} />
          </Field>

          <FormSection title="Classification" />

          <Field id="product-category" label="Category" required>
            <Select name="category" defaultValue={product.category}>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="product-related-service" label="Related Service">
            <Select name="related_service" defaultValue={product.related_service ?? ''}>
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
            <Input name="specs" placeholder="e.g. 550W · Mono PERC" defaultValue={product.specs ?? ''} />
          </Field>
          <Field id="product-description" label="Description">
            <Textarea name="description" rows={4} defaultValue={product.description ?? ''} />
          </Field>
          <Field id="product-badge" label="Badge">
            <Input name="badge" placeholder="e.g. Best Seller" defaultValue={product.badge ?? ''} />
          </Field>

          <FormSection title="Media" />

          {imageUrl && (
            <div className="mb-4">
              <p className="text-xs text-fg-subtle mb-2">Current image</p>
              <img
                src={imageUrl}
                alt={product.name}
                className="w-24 h-24 object-contain rounded-control border border-line bg-slate-50 p-2"
              />
            </div>
          )}

          <Field id="product-image" label="Product Image">
            <input name="image" type="file" accept="image/*" className={fileInputClass} />
          </Field>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/products" pending={isPending} label="Update Product" />
    </>
  );
}
