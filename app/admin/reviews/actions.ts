'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function createReview(fd: FormData): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('reviews').insert({
    reviewer_name: fd.get('reviewer_name') as string,
    quote: fd.get('quote') as string,
    source: fd.get('source') as string,
    rating: Number(fd.get('rating') ?? 5),
  });
  revalidatePath('/admin/reviews');
  redirect('/admin/reviews');
}

export async function updateReview(id: string, fd: FormData): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('reviews')
    .update({
      reviewer_name: fd.get('reviewer_name') as string,
      quote: fd.get('quote') as string,
      source: fd.get('source') as string,
      rating: Number(fd.get('rating') ?? 5),
    })
    .eq('id', id);
  revalidatePath('/admin/reviews');
  redirect('/admin/reviews');
}

export async function deleteReview(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('reviews').delete().eq('id', id);
  revalidatePath('/admin/reviews');
}
