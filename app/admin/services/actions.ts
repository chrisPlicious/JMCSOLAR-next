'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';

export type ServiceFormState = { error: string } | { success: true } | null;

export async function createService(
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState> {
  await requireAdminAuth();

  const icon = fd.get('icon') as string;
  const title = fd.get('title') as string;
  const slug = fd.get('slug') as string;
  const description = fd.get('description') as string;
  const highlight = fd.get('highlight') === 'on';
  const display_order = Number(fd.get('display_order') ?? 0);

  const id = crypto.randomUUID();

  try {
    await adminDb.collection('services').doc(id).set({
      icon,
      title,
      slug,
      description,
      highlight,
      display_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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
      await adminDb.collection('serviceDetails').doc(id).set({
        service_id: id,
        tagline,
        overview,
        what_is_it,
        how_it_works,
        benefits,
        specs,
        use_cases,
        sources,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/services');
  revalidatePath('/services/' + (fd.get('slug') as string));
  revalidatePath('/admin/services');
  return { success: true } as ServiceFormState;
}

export async function updateService(
  id: string,
  prevState: ServiceFormState,
  fd: FormData
): Promise<ServiceFormState> {
  await requireAdminAuth();

  const icon = fd.get('icon') as string;
  const title = fd.get('title') as string;
  const slug = fd.get('slug') as string;
  const description = fd.get('description') as string;
  const highlight = fd.get('highlight') === 'on';
  const display_order = Number(fd.get('display_order') ?? 0);

  try {
    await adminDb.collection('services').doc(id).update({
      icon,
      title,
      slug,
      description,
      highlight,
      display_order,
      updated_at: new Date().toISOString(),
    });

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
      await adminDb.collection('serviceDetails').doc(id).set(
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
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/services');
  revalidatePath('/services/' + (fd.get('slug') as string));
  revalidatePath('/admin/services');
  return { success: true } as ServiceFormState;
}

export async function deleteService(id: string): Promise<void> {
  await requireAdminAuth();
  await adminDb.collection('serviceDetails').doc(id).delete();
  await adminDb.collection('services').doc(id).delete();
  revalidatePath('/admin/services');
}
