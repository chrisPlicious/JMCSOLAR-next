'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile, deleteFiles } from '@/lib/firebase/storage';
import { validateImageUpload, safeExtension } from '@/lib/upload-validation';

type ActionResult = { error?: string; success?: boolean };

export async function createProjectAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();
  const file = formData.get('cover_image') as File | null;
  const completedRaw = (formData.get('completed_at') as string)?.trim() || null;
  const completed_at = completedRaw
    ? completedRaw.length <= 7
      ? `${completedRaw}-01`
      : completedRaw
    : null;

  const projectId = crypto.randomUUID();
  const projectData = {
    id: projectId,
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    system_size: (formData.get('system_size') as string) || null,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    facebook_url: (formData.get('facebook_url') as string) || null,
    cover_image_path: null as string | null,
    completed_at,
    created_at: new Date().toISOString(),
  };

  try {
    await adminDb.collection('projects').doc(projectId).set(projectData);

    if (file && file.size > 0) {
      const uploadError = validateImageUpload(file);
      if (uploadError) return { error: uploadError };

      const ext = safeExtension(file);
      const path = `project-images/${projectId}/cover-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadFile(path, buffer, file.type);

      await adminDb.collection('projects').doc(projectId).update({ cover_image_path: path });

      const imgId = crypto.randomUUID();
      await adminDb.collection('projectImages').doc(imgId).set({
        id: imgId,
        project_id: projectId,
        storage_path: path,
        caption: null,
        display_order: 0,
        created_at: new Date().toISOString(),
      });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { error: message };
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
  const completedRaw = (formData.get('completed_at') as string)?.trim() || null;
  const completed_at = completedRaw
    ? completedRaw.length <= 7
      ? `${completedRaw}-01`
      : completedRaw
    : null;

  try {
    await adminDb.collection('projects').doc(id).update({
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      system_size: (formData.get('system_size') as string) || null,
      description: (formData.get('description') as string) || null,
      location: (formData.get('location') as string) || null,
      facebook_url: (formData.get('facebook_url') as string) || null,
      completed_at,
    });

    const file = formData.get('new_image') as File | null;
    if (file && file.size > 0) {
      const uploadError = validateImageUpload(file);
      if (uploadError) return { error: uploadError };

      const ext = safeExtension(file);
      const path = `project-images/${id}/img-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadFile(path, buffer, file.type);

      const imgId = crypto.randomUUID();
      await adminDb.collection('projectImages').doc(imgId).set({
        id: imgId,
        project_id: id,
        storage_path: path,
        caption: null,
        display_order: 0,
        created_at: new Date().toISOString(),
      });

      const setCover = formData.get('set_as_cover') === 'true';
      if (setCover) {
        await adminDb.collection('projects').doc(id).update({ cover_image_path: path });
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { error: message };
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
