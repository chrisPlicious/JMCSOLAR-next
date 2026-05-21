'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '../login/actions';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
        <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
        <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
        <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Projects',
    href: '/admin/projects',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.5 5.5C1.5 4.395 2.395 3.5 3.5 3.5H6.379C6.777 3.5 7.158 3.658 7.439 3.939L8.561 5.061C8.842 5.342 9.223 5.5 9.621 5.5H14.5C15.605 5.5 16.5 6.395 16.5 7.5V13.5C16.5 14.605 15.605 15.5 14.5 15.5H3.5C2.395 15.5 1.5 14.605 1.5 13.5V5.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Products',
    href: '/admin/products',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 1.5L16.5 5.5V12.5L9 16.5L1.5 12.5V5.5L9 1.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M9 1.5L9 16.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M1.5 5.5L16.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M1.5 5.5L9 9.5L16.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Services',
    href: '/admin/services',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="3" fill="currentColor" />
        <line x1="9" y1="1" x2="9" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="14.5" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="9" x2="3.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14.5" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Reviews',
    href: '/admin/reviews',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 2L10.854 7.09H16.18L11.663 10.271L13.517 15.361L9 12.18L4.483 15.361L6.337 10.271L1.82 7.09H7.146L9 2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Results',
    href: '/admin/results',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="9" y1="2" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2.5" y="4" width="5" height="10" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="10.5" y="4" width="5" height="10" rx="1" fill="currentColor" />
      </svg>
    ),
  },
];

const SignOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 15.5H3.5C2.672 15.5 2 14.828 2 14V4C2 3.172 2.672 2.5 3.5 2.5H7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 12.5L16 9L12 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 9H7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="3" fill="currentColor" />
    <line x1="9" y1="1" x2="9" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="14.5" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="9" x2="3.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14.5" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.222" y1="3.222" x2="4.99" y2="4.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.01" y1="13.01" x2="14.778" y2="14.778" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14.778" y1="3.222" x2="13.01" y2="4.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="4.99" y1="13.01" x2="3.222" y2="14.778" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 w-64 h-screen bg-navy-950 flex flex-col z-40"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Site Identity Block */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-solar-500 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-navy-950">
            <SunIcon />
          </div>
          <div>
            <p className="text-white font-display font-black text-base leading-tight">JMC Solar PH</p>
            <p className="text-white/50 text-xs">Admin Panel</p>
          </div>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-solar-400/60 hover:text-solar-400 text-xs transition-colors flex items-center gap-1"
        >
          View live site
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2">Main Menu</p>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:text-white hover:bg-white/8'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-solar-500 rounded-r-full" />
              )}
              <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? 'bg-white/15' : ''
              }`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account section */}
      <div className="px-3 pb-6 border-t border-white/8 pt-4 mt-auto space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2">Account</p>
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" fill="currentColor" className="text-white/60"/>
              <path d="M1 12.5C1 10.015 3.686 8 7 8s6 2.015 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/60"/>
            </svg>
          </span>
          <span className="text-sm font-medium text-white/70">Admin</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors duration-150"
          >
            <span className="shrink-0 w-7 h-7 flex items-center justify-center">
              <SignOutIcon />
            </span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
