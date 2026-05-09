'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile, deleteFiles } from '@/lib/firebase/storage';
import { validateImageUpload, safeExtension } from '@/lib/upload-validation';
import { requireField } from '@/lib/form-data';

type ActionResult = { error?: string; success?: boolean };

export async function createProjectAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const title = requireField(formData, 'title');
  const category = requireField(formData, 'category');
  if (!title) return { error: 'Project title is required.' };
  if (!category) return { error: 'Category is required.' };

  const completedRaw = (formData.get('completed_at') as string)?.trim() || null;
  const completed_at = completedRaw
    ? completedRaw.length <= 7
      ? `${completedRaw}-01`
      : completedRaw
    : null;

  const projectId = crypto.randomUUID();
  const projectData = {
    id: projectId,
    title,
    category,
    system_size: (formData.get('system_size') as string) || null,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    facebook_url: (formData.get('facebook_url') as string) || null,
    cover_image_path: null as string | null,
    completed_at,
    created_at: new Date().toISOString(),
  };

  try {
    // M3: use create() so UUID collision fails loudly
    await adminDb.collection('projects').doc(projectId).create(projectData);

    const files = formData.getAll('images') as File[];
    let firstPath: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 0) {
        const uploadError = await validateImageUpload(file);
        if (uploadError) return { error: uploadError };

        const ext = safeExtension(file);
        const path = `project-images/${projectId}/img-${Date.now()}-${i}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadFile(path, buffer, file.type);

        if (!firstPath) firstPath = path;

        const imgId = crypto.randomUUID();
        await adminDb.collection('projectImages').doc(imgId).create({
          id: imgId,
          project_id: projectId,
          storage_path: path,
          caption: null,
          display_order: i,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (firstPath) {
      await adminDb.collection('projects').doc(projectId).update({ cover_image_path: firstPath });
    }
  } catch (e: unknown) {
    console.error('[createProjectAction]', e);
    return { error: 'Failed to create project' };
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectAction(
  id: string,
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const title = requireField(formData, 'title');
  const category = requireField(formData, 'category');
  if (!title) return { error: 'Project title is required.' };
  if (!category) return { error: 'Category is required.' };

  const completedRaw = (formData.get('completed_at') as string)?.trim() || null;
  const completed_at = completedRaw
    ? completedRaw.length <= 7
      ? `${completedRaw}-01`
      : completedRaw
    : null;

  try {
    await adminDb.collection('projects').doc(id).update({
      title,
      category,
      system_size: (formData.get('system_size') as string) || null,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      facebook_url: (formData.get('facebook_url') as string) || null,
      completed_at,
    });

    const files = formData.getAll('images') as File[];
    let firstPath: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 0) {
        const uploadError = await validateImageUpload(file);
        if (uploadError) return { error: uploadError };

        const ext = safeExtension(file);
        const path = `project-images/${id}/img-${Date.now()}-${i}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadFile(path, buffer, file.type);

        if (!firstPath) firstPath = path;

        const imgId = crypto.randomUUID();
        await adminDb.collection('projectImages').doc(imgId).create({
          id: imgId,
          project_id: id,
          storage_path: path,
          caption: null,
          display_order: i,
          created_at: new Date().toISOString(),
        });
      }
    }

    const setCover = formData.get('set_as_cover') === 'true';
    if (setCover && firstPath) {
      await adminDb.collection('projects').doc(id).update({ cover_image_path: firstPath });
    }
  } catch (e: unknown) {
    console.error('[updateProjectAction]', e);
    return { error: 'Failed to update project' };
  }

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function deleteProjectAction(id: string): Promise<void> {
  await requireAdminAuth();

  const imagesSnap = await adminDb
    .collection('projectImages')
    .where('project_id', '==', id)
    .get();

  const storagePaths = imagesSnap.docs.map((doc) => doc.data().storage_path as string);
  if (storagePaths.length > 0) {
    await deleteFiles(storagePaths);
  }

  // Batch delete all projectImages docs
  if (imagesSnap.docs.length > 0) {
    const batch = adminDb.batch();
    for (const doc of imagesSnap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  await adminDb.collection('projects').doc(id).delete();

  revalidatePath('/projects');
  revalidatePath('/admin/projects');
}

export async function deleteImageAction(
  imageId: string,
  storagePath: string,
  projectId: string,
): Promise<void> {
  await requireAdminAuth();

  await deleteFile(storagePath);
  await adminDb.collection('projectImages').doc(imageId).delete();

  const projectSnap = await adminDb.collection('projects').doc(projectId).get();
  const project = projectSnap.data();
  if (project?.cover_image_path === storagePath) {
    await adminDb.collection('projects').doc(projectId).update({ cover_image_path: null });
  }

  revalidatePath('/admin/projects');
}

export async function setCoverAction(
  projectId: string,
  storagePath: string,
): Promise<void> {
  await requireAdminAuth();
  await adminDb.collection('projects').doc(projectId).update({ cover_image_path: storagePath });
  revalidatePath('/projects');
  revalidatePath('/admin/projects');
}
