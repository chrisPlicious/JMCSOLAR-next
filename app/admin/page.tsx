import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-navy-900 font-black text-3xl mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Dashboard
      </h1>
      <p className="text-slate-500 text-sm mb-10">Manage your projects and products.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/admin/projects"
          className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy-300 transition-colors"
        >
          <h2 className="font-bold text-navy-900 text-lg mb-1">Projects</h2>
          <p className="text-slate-500 text-sm">Add, edit, and delete project entries with photos.</p>
        </Link>
        <Link
          href="/admin/products"
          className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-navy-300 transition-colors"
        >
          <h2 className="font-bold text-navy-900 text-lg mb-1">Products</h2>
          <p className="text-slate-500 text-sm">Manage your product catalog with images.</p>
        </Link>
      </div>
    </div>
  );
}
