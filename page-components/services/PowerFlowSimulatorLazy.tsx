'use client';

import dynamic from 'next/dynamic';
import type { SystemId } from '@/lib/power-flow/systems';

// Client-only and split out: the diagram depends on the card's width, and only
// the hybrid and on-grid service pages need this code.
const PowerFlowSimulator = dynamic(() => import('./PowerFlowSimulator'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="min-h-[1700px] rounded-panel border border-line bg-white shadow-card md:min-h-[1300px] xl:min-h-[760px]"
    />
  ),
});

export default function PowerFlowSimulatorLazy({ system }: { system: SystemId }) {
  return <PowerFlowSimulator system={system} />;
}
