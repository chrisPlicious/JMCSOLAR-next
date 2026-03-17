import { use } from 'react';
import { notFound } from 'next/navigation';
import HybridPage from '@/page-components/services/HybridPage';
import OnGridPage from '@/page-components/services/OnGridPage';
import BessPage from '@/page-components/services/BessPage';
import PumpPage from '@/page-components/services/PumpPage';
import EvPage from '@/page-components/services/EvPage';
import UpsPage from '@/page-components/services/UpsPage';
import ControllerPage from '@/page-components/services/ControllerPage';

const servicePages: Record<string, React.ComponentType> = {
  hybrid: HybridPage,
  ongrid: OnGridPage,
  bess: BessPage,
  pump: PumpPage,
  ev: EvPage,
  ups: UpsPage,
  controller: ControllerPage,
};

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const Page = servicePages[id];
  if (!Page) notFound();
  return <Page />;
}
