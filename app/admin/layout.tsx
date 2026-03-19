'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import AdminNav from './_components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  if (isLogin) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminNav />
      <div className="flex-1 ml-64 min-h-screen">
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
