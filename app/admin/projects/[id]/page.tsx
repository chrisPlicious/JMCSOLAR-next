import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import EditProjectForm from '../_components/EditProjectForm';
import PhotoGrid from '../_components/PhotoGrid';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [projectSnap, imagesSnap] = await Promise.all([
    adminDb.collection('projects').doc(id).get(),
    adminDb.collection('projectImages').where('project_id', '==', id).orderBy('display_order', 'asc').get(),
  ]);

  if (!projectSnap.exists) notFound();

  const project = { id: projectSnap.id, ...projectSnap.data() } as {
    id: string;
    title: string;
    category: string;
    system_size: string | null;
    description: string | null;
    location: string | null;
    facebook_url: string | null;
    cover_image_path: string | null;
    completed_at: string | null;
    created_at: string;
  };

  const imagesWithUrls = imagesSnap.docs.map((doc) => {
    const img = { id: doc.id, ...doc.data() } as {
      id: string;
      project_id: string;
      storage_path: string;
      caption: string | null;
      display_order: number;
      created_at: string;
    };
    return {
      ...img,
      url: getPublicUrl(img.storage_path),
    };
  });

  return (
    <div>
      <EditProjectForm project={project} />
      <PhotoGrid
        images={imagesWithUrls}
        projectId={id}
        coverPath={project.cover_image_path}
      />
    </div>
  );
}
