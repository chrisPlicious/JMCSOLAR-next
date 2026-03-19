import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ServicePageLayout from '@/components/ui/ServicePageLayout';
import ServiceEmptyState from '@/components/ui/ServiceEmptyState';
import type { DbService, DbServiceDetail } from '@/lib/supabase/types';

export const revalidate = 60;

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;

  const supabase = createSupabaseServerClient();

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .single<DbService>();

  if (!service) {
    notFound();
  }

  const { data: detail } = await supabase
    .from('service_details')
    .select('*')
    .eq('service_id', service.id)
    .single<DbServiceDetail>();

  if (!detail) {
    return <ServiceEmptyState service={service} />;
  }

  return (
    <ServicePageLayout
      heroBgImage="/assets/bg-4.jpg"
      title={service.title}
      iconName={service.icon}
      serviceId={service.slug}
      tagline={detail.tagline}
      overview={detail.overview}
      whatIsIt={detail.what_is_it}
      howItWorks={detail.how_it_works}
      benefits={detail.benefits}
      useCases={detail.use_cases.map((u) => u.item)}
      specs={detail.specs}
      sources={detail.sources}
    />
  );
}
