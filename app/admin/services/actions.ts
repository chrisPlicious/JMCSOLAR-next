'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type ServiceFormState = { error: string } | null;

export async function createService(
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState> {
  const supabase = createSupabaseAdminClient();

  const icon = fd.get('icon') as string;
  const title = fd.get('title') as string;
  const slug = fd.get('slug') as string;
  const description = fd.get('description') as string;
  const highlight = fd.get('highlight') === 'on';
  const display_order = Number(fd.get('display_order') ?? 0);

  let serviceId: string;

  try {
    const { data, error } = await supabase
      .from('services')
      .upsert(
        { icon, title, slug, description, highlight, display_order },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (error) return { error: error.message };
    serviceId = data.id;

    // Detail fields
    const tagline = (fd.get('tagline') as string) ?? '';
    const overview = (fd.get('overview') as string) ?? '';
    const what_is_it = (fd.get('what_is_it') as string) ?? '';

    // how_it_works
    const how_it_works: { step: string; description: string }[] = [];
    for (let i = 0; ; i++) {
      const step = fd.get(`hw_step_${i}`) as string | null;
      const desc = fd.get(`hw_desc_${i}`) as string | null;
      if (!step && !desc) break;
      how_it_works.push({ step: step ?? '', description: desc ?? '' });
    }

    // benefits
    const benefits: { iconName: string; title: string; description: string }[] = [];
    for (let i = 0; ; i++) {
      const iconName = fd.get(`ben_icon_${i}`) as string | null;
      const benTitle = fd.get(`ben_title_${i}`) as string | null;
      const benDesc = fd.get(`ben_desc_${i}`) as string | null;
      if (!iconName && !benTitle && !benDesc) break;
      benefits.push({ iconName: iconName ?? '', title: benTitle ?? '', description: benDesc ?? '' });
    }

    // specs
    const specs: { label: string; value: string }[] = [];
    for (let i = 0; ; i++) {
      const label = fd.get(`spec_label_${i}`) as string | null;
      const value = fd.get(`spec_value_${i}`) as string | null;
      if (!label && !value) break;
      specs.push({ label: label ?? '', value: value ?? '' });
    }

    // use_cases
    const use_cases: { item: string }[] = [];
    for (let i = 0; ; i++) {
      const item = fd.get(`uc_item_${i}`) as string | null;
      if (!item) break;
      use_cases.push({ item });
    }

    // sources
    const sources: { title: string; url: string; publisher: string }[] = [];
    for (let i = 0; ; i++) {
      const srcTitle = fd.get(`src_title_${i}`) as string | null;
      const srcUrl = fd.get(`src_url_${i}`) as string | null;
      const srcPub = fd.get(`src_pub_${i}`) as string | null;
      if (!srcTitle && !srcUrl && !srcPub) break;
      sources.push({ title: srcTitle ?? '', url: srcUrl ?? '', publisher: srcPub ?? '' });
    }

    const hasDetail =
      tagline.trim() !== '' ||
      overview.trim() !== '' ||
      what_is_it.trim() !== '' ||
      how_it_works.length > 0 ||
      benefits.length > 0 ||
      specs.length > 0 ||
      use_cases.length > 0 ||
      sources.length > 0;

    if (hasDetail) {
      const { error: detailError } = await supabase.from('service_details').upsert(
        {
          service_id: serviceId,
          tagline,
          overview,
          what_is_it,
          how_it_works,
          benefits,
          specs,
          use_cases,
          sources,
        },
        { onConflict: 'service_id' }
      );
      if (detailError) return { error: detailError.message };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/services');
  revalidatePath('/services/' + (fd.get('slug') as string));
  redirect('/admin/services');
}

export async function updateService(
  id: string,
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState> {
  const supabase = createSupabaseAdminClient();

  const icon = fd.get('icon') as string;
  const title = fd.get('title') as string;
  const slug = fd.get('slug') as string;
  const description = fd.get('description') as string;
  const highlight = fd.get('highlight') === 'on';
  const display_order = Number(fd.get('display_order') ?? 0);

  try {
    const { error } = await supabase
      .from('services')
      .update({ icon, title, slug, description, highlight, display_order })
      .eq('id', id);

    if (error) return { error: error.message };

    // Detail fields
    const tagline = (fd.get('tagline') as string) ?? '';
    const overview = (fd.get('overview') as string) ?? '';
    const what_is_it = (fd.get('what_is_it') as string) ?? '';

    // how_it_works
    const how_it_works: { step: string; description: string }[] = [];
    for (let i = 0; ; i++) {
      const step = fd.get(`hw_step_${i}`) as string | null;
      const desc = fd.get(`hw_desc_${i}`) as string | null;
      if (!step && !desc) break;
      how_it_works.push({ step: step ?? '', description: desc ?? '' });
    }

    // benefits
    const benefits: { iconName: string; title: string; description: string }[] = [];
    for (let i = 0; ; i++) {
      const iconName = fd.get(`ben_icon_${i}`) as string | null;
      const benTitle = fd.get(`ben_title_${i}`) as string | null;
      const benDesc = fd.get(`ben_desc_${i}`) as string | null;
      if (!iconName && !benTitle && !benDesc) break;
      benefits.push({ iconName: iconName ?? '', title: benTitle ?? '', description: benDesc ?? '' });
    }

    // specs
    const specs: { label: string; value: string }[] = [];
    for (let i = 0; ; i++) {
      const label = fd.get(`spec_label_${i}`) as string | null;
      const value = fd.get(`spec_value_${i}`) as string | null;
      if (!label && !value) break;
      specs.push({ label: label ?? '', value: value ?? '' });
    }

    // use_cases
    const use_cases: { item: string }[] = [];
    for (let i = 0; ; i++) {
      const item = fd.get(`uc_item_${i}`) as string | null;
      if (!item) break;
      use_cases.push({ item });
    }

    // sources
    const sources: { title: string; url: string; publisher: string }[] = [];
    for (let i = 0; ; i++) {
      const srcTitle = fd.get(`src_title_${i}`) as string | null;
      const srcUrl = fd.get(`src_url_${i}`) as string | null;
      const srcPub = fd.get(`src_pub_${i}`) as string | null;
      if (!srcTitle && !srcUrl && !srcPub) break;
      sources.push({ title: srcTitle ?? '', url: srcUrl ?? '', publisher: srcPub ?? '' });
    }

    const hasDetail =
      tagline.trim() !== '' ||
      overview.trim() !== '' ||
      what_is_it.trim() !== '' ||
      how_it_works.length > 0 ||
      benefits.length > 0 ||
      specs.length > 0 ||
      use_cases.length > 0 ||
      sources.length > 0;

    if (hasDetail) {
      const { error: detailError } = await supabase.from('service_details').upsert(
        {
          service_id: id,
          tagline,
          overview,
          what_is_it,
          how_it_works,
          benefits,
          specs,
          use_cases,
          sources,
        },
        { onConflict: 'service_id' }
      );
      if (detailError) return { error: detailError.message };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/services');
  revalidatePath('/services/' + (fd.get('slug') as string));
  redirect('/admin/services');
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('services').delete().eq('id', id);
  revalidatePath('/admin/services');
}
