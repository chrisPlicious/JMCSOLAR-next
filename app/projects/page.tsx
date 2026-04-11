import ProjectsPage from '@/page-components/projects/ProjectIndex';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { Project } from '@/types';

export default async function Projects() {
  const snap = await adminDb.collection('projects').orderBy('created_at', 'desc').get();

  const projects: Project[] = snap.docs.map((doc) => {
    const data = doc.data() as {
      title: string;
      category: string;
      system_size: string | null;
      description: string | null;
      location: string | null;
      facebook_url: string | null;
      cover_image_path: string | null;
      created_at: string;
      completed_at: string | null;
    };
    return {
      ...data,
      id: doc.id,
      category: data.category as Project['category'],
      cover_image_path: getPublicUrl(data.cover_image_path),
    };
  });

  return <ProjectsPage projects={projects} />;
}
