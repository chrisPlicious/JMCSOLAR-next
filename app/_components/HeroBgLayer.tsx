'use client';
import { usePathname } from 'next/navigation';

export default function HeroBgLayer() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 bg-cover bg-center"
      style={{ backgroundImage: 'url(/assets/bg-1.jpg)', zIndex: 0 }}
    >
      <div className="absolute inset-0 bg-linear-to-t from-navy-950/50 via-transparent to-navy-950/30" />
    </div>
  );
}
