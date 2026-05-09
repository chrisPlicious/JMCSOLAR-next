import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const path = formData.get('path') as string | null;

  if (!file || !path) {
    return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(path);

  await fileRef.save(buffer, { contentType: file.type, resumable: false });
  await fileRef.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
