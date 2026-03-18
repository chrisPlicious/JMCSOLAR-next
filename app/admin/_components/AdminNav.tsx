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
      className="fixed left-0 top-0 w-56 h-screen bg-navy-950 flex flex-col z-40"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="bg-solar-500 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-navy-950">
          <SunIcon />
        </div>
        <span className="text-white font-display font-black text-base leading-tight">
          JMC Admin
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-solar-500 rounded-r-full" />
              )}
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-6">
        <form action={logoutAction}>
          <button
            type="submit"
            className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors duration-150"
          >
            <span className="flex-shrink-0">
              <SignOutIcon />
            </span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
