'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Folder,
  LayoutGrid,
  LogOut,
  Package,
  Star,
  Sun,
  SunMedium,
  Columns2,
  User,
  type LucideIcon,
} from 'lucide-react';
import { logoutAction } from '../login/actions';

const navItems: { label: string; href: string; exact: boolean; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/admin', exact: true, icon: LayoutGrid },
  { label: 'Calendar', href: '/admin/calendar', exact: false, icon: CalendarDays },
  { label: 'Projects', href: '/admin/projects', exact: false, icon: Folder },
  { label: 'Products', href: '/admin/products', exact: false, icon: Package },
  // No Services entry: services are defined in data/services.ts, not the CMS.
  { label: 'Reviews', href: '/admin/reviews', exact: false, icon: Star },
  { label: 'Results', href: '/admin/results', exact: false, icon: Columns2 },
  { label: 'Bookings', href: '/admin/bookings', exact: false, icon: CalendarCheck },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="surface-dark fixed left-0 top-0 w-64 h-screen bg-navy-950 flex flex-col z-40">
      {/* Site Identity Block */}
      <div className="px-5 py-6 border-b border-line">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-solar-500 w-9 h-9 rounded-control flex items-center justify-center shrink-0 text-navy-950">
            <Sun className="size-[18px]" aria-hidden />
          </div>
          <div>
            <p className="text-fg font-display font-black text-base leading-tight">JMC Solar PH</p>
            <p className="text-fg-subtle text-xs">Admin Panel</p>
          </div>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-solar-ink hover:underline text-xs font-semibold flex items-center gap-1"
        >
          View live site
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        <p className="caps px-3 mb-2">Main Menu</p>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-white/10 text-fg'
                  : 'text-fg-subtle hover:text-fg hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-solar-500 rounded-r-full" />
              )}
              <span className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                isActive ? 'bg-white/15' : ''
              }`}>
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account section */}
      <div className="px-3 pb-6 border-t border-line pt-4 mt-auto space-y-0.5">
        <p className="caps px-3 mb-2">Account</p>
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-fg-subtle">
            <User className="size-3.5" aria-hidden />
          </span>
          <span className="text-sm font-medium text-fg-muted">Admin</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-control text-sm font-medium text-fg-subtle hover:text-fg-muted hover:bg-white/5 transition-colors duration-150"
          >
            <span className="shrink-0 w-7 h-7 flex items-center justify-center">
              <LogOut className="size-[18px]" aria-hidden />
            </span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
