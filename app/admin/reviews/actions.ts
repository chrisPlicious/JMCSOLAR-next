'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { requireField } from '@/lib/form-data';

export async function createReview(fd: FormData): Promise<void> {
  await requireAdminAuth();
  const reviewer_name = requireField(fd, 'reviewer_name');
  const quote = requireField(fd, 'quote');
  if (!reviewer_name || !quote) return;
  const id = crypto.randomUUID();
  // M3: create() fails loudly on UUID collision
  await adminDb.collection('reviews').doc(id).create({
    id,
    reviewer_name,
    quote,
    source: fd.get('source') as string,
    rating: Number(fd.get('rating') ?? 5),
    city_slug: (fd.get('city_slug') as string) || null,
    status: 'approved',
    created_at: new Date().toISOString(),
  });
  revalidatePath('/admin/reviews');
  redirect('/admin/reviews');
}

export async function createReviewFromDialog(
  _prev: { error: string } | null,
  fd: FormData
): Promise<{ error: string } | null> {
  await requireAdminAuth();
  const reviewer_name = requireField(fd, 'reviewer_name');
  const quote = requireField(fd, 'quote');
  if (!reviewer_name) return { error: 'Reviewer name is required.' };
  if (!quote) return { error: 'Review quote is required.' };
  try {
    const id = crypto.randomUUID();
    await adminDb.collection('reviews').doc(id).create({
      id,
      reviewer_name,
      quote,
      source: fd.get('source') as string,
      rating: Number(fd.get('rating') ?? 5),
      city_slug: (fd.get('city_slug') as string) || null,
      status: 'approved',
      created_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[createReviewFromDialog]', err);
    return { error: 'Failed to save review' };
  }
  revalidatePath('/admin/reviews');
  return null;
}

export async function updateReview(id: string, fd: FormData): Promise<void> {
  await requireAdminAuth();
  const reviewer_name = requireField(fd, 'reviewer_name');
  const quote = requireField(fd, 'quote');
  if (!reviewer_name || !quote) return;
  const updateData: Record<string, unknown> = {
    reviewer_name,
    quote,
    source: fd.get('source') as string,
    rating: Number(fd.get('rating') ?? 5),
    city_slug: (fd.get('city_slug') as string) || null,
    updated_at: new Date().toISOString(),
  };
  const status = fd.get('status');
  if (status) {
    updateData.status = status as string;
  }
  await adminDb.collection('reviews').doc(id).update(updateData);
  revalidatePath('/admin/reviews');
  redirect('/admin/reviews');
}

export async function approveReview(id: string): Promise<void> {
  await requireAdminAuth();
  await adminDb.collection('reviews').doc(id).update({
    status: 'approved',
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/admin/reviews');
}

export async function rejectReview(id: string): Promise<void> {
  await requireAdminAuth();
  await adminDb.collection('reviews').doc(id).update({
    status: 'rejected',
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/admin/reviews');
}

export async function deleteReview(id: string): Promise<void> {
  await requireAdminAuth();
  await adminDb.collection('reviews').doc(id).delete();
  revalidatePath('/admin/reviews');
}
