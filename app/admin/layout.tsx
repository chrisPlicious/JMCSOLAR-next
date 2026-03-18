import Link from 'next/link';
import { logoutAction } from './login/actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-black text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
            JMC Admin
          </span>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin/projects" className="text-white/70 hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/admin/products" className="text-white/70 hover:text-white transition-colors">
              Products
            </Link>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
