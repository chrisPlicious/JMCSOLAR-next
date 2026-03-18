'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function createService(fd: FormData): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('services').insert({
    icon: fd.get('icon') as string,
    title: fd.get('title') as string,
    description: fd.get('description') as string,
    highlight: fd.get('highlight') === 'on',
    display_order: Number(fd.get('display_order') ?? 0),
  });
  revalidatePath('/admin/services');
  redirect('/admin/services');
}

export async function updateService(id: string, fd: FormData): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('services')
    .update({
      icon: fd.get('icon') as string,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      highlight: fd.get('highlight') === 'on',
      display_order: Number(fd.get('display_order') ?? 0),
    })
    .eq('id', id);
  revalidatePath('/admin/services');
  redirect('/admin/services');
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('services').delete().eq('id', id);
  revalidatePath('/admin/services');
}
