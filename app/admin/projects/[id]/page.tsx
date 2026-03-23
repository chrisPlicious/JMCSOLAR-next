import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import EditProjectForm from '../_components/EditProjectForm';
import PhotoGrid from '../_components/PhotoGrid';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const [{ data: project }, { data: images }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_images').select('*').eq('project_id', id).order('display_order'),
  ]);
  if (!project) notFound();

  const imagesWithUrls = (images ?? []).map((img) => ({
    ...img,
    url: getPublicUrl('project-images', img.storage_path),
  }));

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
