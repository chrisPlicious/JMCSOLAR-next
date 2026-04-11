'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';

export async function createReview(fd: FormData): Promise<void> {
  await requireAdminAuth();
  const id = crypto.randomUUID();
  await adminDb.collection('reviews').doc(id).set({
    id,
    reviewer_name: fd.get('reviewer_name') as string,
    quote: fd.get('quote') as string,
    source: fd.get('source') as string,
    rating: Number(fd.get('rating') ?? 5),
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
  try {
    const id = crypto.randomUUID();
    await adminDb.collection('reviews').doc(id).set({
      id,
      reviewer_name: fd.get('reviewer_name') as string,
      quote: fd.get('quote') as string,
      source: fd.get('source') as string,
      rating: Number(fd.get('rating') ?? 5),
      status: 'approved',
      created_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
  revalidatePath('/admin/reviews');
  return null;
}

export async function updateReview(id: string, fd: FormData): Promise<void> {
  await requireAdminAuth();
  const updateData: Record<string, unknown> = {
    reviewer_name: fd.get('reviewer_name') as string,
    quote: fd.get('quote') as string,
    source: fd.get('source') as string,
    rating: Number(fd.get('rating') ?? 5),
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
