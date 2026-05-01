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
    />
  );
}
