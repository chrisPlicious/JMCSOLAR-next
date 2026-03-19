import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ServiceForm from '../_components/ServiceForm';
import { updateService } from '../actions';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: service } = await supabase.from('services').select('*').eq('id', id).single();
  if (!service) notFound();

  const { data: detail } = await supabase
    .from('service_details')
    .select('*')
    .eq('service_id', id)
    .single();

  const bound = updateService.bind(null, id);
  return <ServiceForm action={bound} service={service} detail={detail ?? null} />;
}
