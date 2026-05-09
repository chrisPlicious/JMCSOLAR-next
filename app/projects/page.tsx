import type { Metadata } from 'next';
import ProjectsPage from '@/page-components/projects/ProjectIndex';
import { adminDb } from '@/lib/firebase/admin';
import { getPublicUrl } from '@/lib/firebase/storage';
import type { Project, ProjectImage } from '@/types';
import { makeBreadcrumbLd } from '@/lib/seo/breadcrumb';

export const metadata: Metadata = {
  title: 'Completed Projects',
  description:
    'See completed solar installation projects by JMC Solar PH across Leyte and Visayas. From residential rooftops to 100kW+ commercial systems.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Completed Projects | JMC Solar PH',
    description:
      'Solar installation projects across Leyte and Visayas. Residential, commercial, and industrial systems.',
  },
};

export default async function Projects() {
  const [snap, imagesSnap] = await Promise.all([
    adminDb.collection('projects').orderBy('created_at', 'desc').get(),
    adminDb.collection('projectImages').orderBy('display_order').get(),
  ]);

  const imagesByProject: Record<string, ProjectImage[]> = {};
  for (const doc of imagesSnap.docs) {
    const data = doc.data() as { project_id: string; storage_path: string; caption: string | null; display_order: number };
    if (!imagesByProject[data.project_id]) imagesByProject[data.project_id] = [];
    imagesByProject[data.project_id].push({
      id: doc.id,
      storage_path: getPublicUrl(data.storage_path) ?? data.storage_path,
      caption: data.caption ?? null,
      display_order: data.display_order ?? 0,
    });
  }

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
      images: imagesByProject[doc.id] ?? [],
    };
  });

  const breadcrumb = makeBreadcrumbLd([
    { name: 'Home', url: '/' },
    { name: 'Completed Projects', url: '/projects' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ProjectsPage projects={projects} />
    </>
  );
}
