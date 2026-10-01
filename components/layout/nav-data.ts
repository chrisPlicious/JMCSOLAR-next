import { Calculator, CalendarCheck, Car, Droplets, MapPin, Package, Sun, Wrench, Zap, type LucideIcon } from 'lucide-react';
import { NAV_SERVICES, SERVICES } from '@/data/services';
import { SERVICE_AREA } from '@/lib/seo/business';

/** Shared by the desktop bar, the Services mega menu and the mobile sheet. */

export function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

// Every route reachable from the Services menu marks "Services" active.
export const SERVICES_ROUTES = ['/services', '/products', '/calculator', '/locations', '/booking'];

export const TOP_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/results', label: 'Results' },
] as const;

// Explicit imports (not `import * as Icons`) so the client bundle only carries
// these icons. Keyed by the lucide name stored on each service.
const SERVICE_ICONS: Record<string, LucideIcon> = { Sun, Zap, Droplets, Car, Wrench };

// Nav-only copy: a short label for mobile chips and a one-line benefit for the
// mega menu (the full descriptions in data/services.ts are too long here).
const NAV_COPY: Record<string, { short: string; blurb: string }> = {
  'hybrid':                { short: 'Hybrid',        blurb: 'Stay powered through brownouts' },
  'ongrid':                { short: 'On-grid',       blurb: 'Cut your bill with net metering' },
  'pump':                  { short: 'Solar pumping', blurb: 'Water for farms and irrigation' },
  'ev':                    { short: 'EV chargers',   blurb: 'Charge at home on solar power' },
  'operation-maintenance': { short: 'Maintenance',   blurb: 'Cleaning, checks and repairs' },
};

const iconBySlug = new Map(SERVICES.map((s) => [s.slug, SERVICE_ICONS[s.icon] ?? Sun]));

export const NAV_SERVICE_ITEMS = NAV_SERVICES.map((s) => ({
  href:  `/services/${s.slug}`,
  title: s.title,
  short: NAV_COPY[s.slug]?.short ?? s.title,
  blurb: NAV_COPY[s.slug]?.blurb ?? '',
  icon:  iconBySlug.get(s.slug) ?? Sun,
}));

export const PLAN_LINKS = [
  { href: '/calculator', label: 'Solar calculator', blurb: 'Estimate system size and savings', icon: Calculator },
  { href: '/products',   label: 'Products',         blurb: 'Panels, inverters and batteries',  icon: Package },
  { href: '/locations',  label: 'Locations',        blurb: SERVICE_AREA,                       icon: MapPin },
] as const;

export const BOOKING_LINK = { href: '/booking', label: 'Book a service', icon: CalendarCheck } as const;
