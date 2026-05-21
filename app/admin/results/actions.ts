'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';
import { validateImageUpload, safeExtension } from '@/lib/upload-validation';

type ActionResult = { error?: string; success?: boolean };

export async function createResultAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const beforeFile = formData.get('before_image') as File;
  const afterFile = formData.get('after_image') as File;

  if (!beforeFile || beforeFile.size === 0) return { error: 'Before image is required.' };
  if (!afterFile || afterFile.size === 0) return { error: 'After image is required.' };

  const beforeError = await validateImageUpload(beforeFile);
  if (beforeError) return { error: beforeError };
  const afterError = await validateImageUpload(afterFile);
  if (afterError) return { error: afterError };

  const resultId = crypto.randomUUID();
  const countSnap = await adminDb.collection('results').count().get();
  const displayOrder = countSnap.data().count;

  try {
    const beforeExt = safeExtension(beforeFile);
    const afterExt = safeExtension(afterFile);
    const beforePath = `results/${resultId}/before.${beforeExt}`;
    const afterPath = `results/${resultId}/after.${afterExt}`;

    await uploadFile(beforePath, Buffer.from(await beforeFile.arrayBuffer()), beforeFile.type);
    await uploadFile(afterPath, Buffer.from(await afterFile.arrayBuffer()), afterFile.type);

    await adminDb.collection('results').doc(resultId).create({
      id: resultId,
      before_image_path: beforePath,
      after_image_path: afterPath,
      display_order: displayOrder,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[createResultAction]', e);
    return { error: 'Failed to create result.' };
  }

  revalidatePath('/results');
  revalidatePath('/admin/results');
  return { success: true };
}

export async function updateResultAction(
  id: string,
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminAuth();

  const existingBeforePath = formData.get('existing_before_path') as string;
  const existingAfterPath = formData.get('existing_after_path') as string;

  try {
    const updates: Record<string, unknown> = {};

    const beforeFile = formData.get('before_image') as File;
    if (beforeFile && beforeFile.size > 0) {
      const err = await validateImageUpload(beforeFile);
      if (err) return { error: err };
      const ext = safeExtension(beforeFile);
      const path = `results/${id}/before-${Date.now()}.${ext}`;
      await uploadFile(path, Buffer.from(await beforeFile.arrayBuffer()), beforeFile.type);
      if (existingBeforePath) await deleteFile(existingBeforePath);
      updates.before_image_path = path;
    }

    const afterFile = formData.get('after_image') as File;
    if (afterFile && afterFile.size > 0) {
      const err = await validateImageUpload(afterFile);
      if (err) return { error: err };
      const ext = safeExtension(afterFile);
      const path = `results/${id}/after-${Date.now()}.${ext}`;
      await uploadFile(path, Buffer.from(await afterFile.arrayBuffer()), afterFile.type);
      if (existingAfterPath) await deleteFile(existingAfterPath);
      updates.after_image_path = path;
    }

    await adminDb.collection('results').doc(id).update(updates);
  } catch (e) {
    console.error('[updateResultAction]', e);
    return { error: 'Failed to update result.' };
  }

  revalidatePath('/results');
  revalidatePath('/admin/results');
  return { success: true };
}

export async function deleteResultAction(id: string): Promise<void> {
  await requireAdminAuth();

  const doc = await adminDb.collection('results').doc(id).get();
  const data = doc.data();
  if (data) {
    const paths = [data.before_image_path, data.after_image_path].filter(Boolean) as string[];
    await Promise.all(paths.map((p) => deleteFile(p)));
  }
  await adminDb.collection('results').doc(id).delete();

  revalidatePath('/results');
  revalidatePath('/admin/results');
}
