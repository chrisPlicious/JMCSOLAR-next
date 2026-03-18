'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function createProjectAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();

  const file = formData.get('cover_image') as File | null;
  let cover_image_path: string | null = null;

  if (file && file.size > 0) {
    const { data: project } = await supabase
      .from('projects')
      .insert({
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        system_size: (formData.get('system_size') as string) || null,
        description: (formData.get('description') as string) || null,
        location: (formData.get('location') as string) || null,
        facebook_url: (formData.get('facebook_url') as string) || null,
      })
      .select('id')
      .single();

    if (project) {
      const ext = file.name.split('.').pop();
      const path = `${project.id}/cover-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(path, file);

      if (!uploadError) {
        await supabase.from('projects').update({ cover_image_path: path }).eq('id', project.id);
        await supabase.from('project_images').insert({
          project_id: project.id,
          storage_path: path,
          display_order: 0,
        });
      }
    }
  } else {
    await supabase.from('projects').insert({
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      system_size: (formData.get('system_size') as string) || null,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      facebook_url: (formData.get('facebook_url') as string) || null,
      cover_image_path,
    });
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();

  await supabase.from('projects').update({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    system_size: (formData.get('system_size') as string) || null,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    facebook_url: (formData.get('facebook_url') as string) || null,
  }).eq('id', id);

  const file = formData.get('new_image') as File | null;
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop();
    const path = `${id}/img-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('project-images').upload(path, file);
    if (!error) {
      const setCover = formData.get('set_as_cover') === 'true';
      await supabase.from('project_images').insert({ project_id: id, storage_path: path, display_order: 0 });
      if (setCover) {
        await supabase.from('projects').update({ cover_image_path: path }).eq('id', id);
      }
    }
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function deleteProjectAction(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data: images } = await supabase
    .from('project_images')
    .select('storage_path')
    .eq('project_id', id);

  if (images?.length) {
    await supabase.storage
      .from('project-images')
      .remove(images.map((i) => i.storage_path));
  }

  await supabase.from('projects').delete().eq('id', id);
  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

export async function deleteImageAction(imageId: string, storagePath: string, projectId: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from('project-images').remove([storagePath]);
  await supabase.from('project_images').delete().eq('id', imageId);

  const { data: project } = await supabase
    .from('projects')
    .select('cover_image_path')
    .eq('id', projectId)
    .single();
  if (project?.cover_image_path === storagePath) {
    await supabase.from('projects').update({ cover_image_path: null }).eq('id', projectId);
  }

  revalidatePath('/admin/projects');
  redirect(`/admin/projects/${projectId}`);
}

export async function setCoverAction(projectId: string, storagePath: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from('projects').update({ cover_image_path: storagePath }).eq('id', projectId);
  revalidatePath('/projects');
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}
