import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';

// Booking pages are thin conversion funnels / multi-step forms with no unique
// server content, and they inherit the homepage canonical (GSC "Alternate page
// with proper canonical tag"). noindex,follow cascades to every /booking/* child
// (including the client-component form pages that can't export metadata) and
// clears the alternate-canonical limbo while preserving outbound link equity.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
