import ProjectsPage from '@/page-components/projects/ProjectIndex';
import { createSupabaseServerClient, getPublicUrl } from '@/lib/supabase/server';
import type { Project } from '@/types';

export default async function Projects() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const projects: Project[] = (data ?? []).map((p) => ({
    ...p,
    cover_image_path: getPublicUrl('project-images', p.cover_image_path),
  }));

  return <ProjectsPage projects={projects} />;
}
