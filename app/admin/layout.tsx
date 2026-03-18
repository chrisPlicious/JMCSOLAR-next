import AdminNav from './_components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminNav />
      <div className="flex-1 ml-56 min-h-screen">
        <main className="p-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
