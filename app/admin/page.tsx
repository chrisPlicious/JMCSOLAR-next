import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBookingType } from '@/lib/firebase/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const BOOKING_TYPE_LABELS: Record<DbBookingType, string> = {
  consultation: 'Consultation',
  maintenance: 'Maintenance',
  site_assessment: 'Site Assessment',
};

function StatCard({
  count,
  label,
  accent,
  secondary,
  secondaryClass = 'text-slate-400',
  href,
}: {
  count: number;
  label: string;
  accent: string;
  secondary: string;
  secondaryClass?: string;
  href?: string;
}) {
  const inner = (
    <div className="col-span-1 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden h-full hover:border-slate-200 transition-colors">
      <div className={`h-1 w-full ${accent}`} />
      <div className="p-5">
        <p className="text-5xl font-black text-navy-950 leading-none">{count}</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">{label}</p>
        <p className={`text-xs mt-1 ${secondaryClass}`}>{secondary}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="col-span-1">
      {inner}
    </Link>
  ) : (
    inner
  );
}

type ActivityType = 'project' | 'product' | 'booking' | 'result';

const ACTIVITY_STYLES: Record<ActivityType, { dot: string; badge: string }> = {
  project: { dot: 'bg-navy-950', badge: 'bg-navy-50 text-navy-700' },
  product: { dot: 'bg-solar-500', badge: 'bg-solar-50 text-solar-700' },
  booking: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  result: { dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
};

const ACTIVITY_HREF: Record<ActivityType, string> = {
  project: '/admin/projects',
  product: '/admin/products',
  booking: '/admin/bookings',
  result: '/admin/results',
};

export default async function AdminDashboard() {
  await requireAdminAuth();

  const [
    projectCountAgg,
    productCountAgg,
    serviceCountAgg,
    reviewCountAgg,
    bookingCountAgg,
    resultCountAgg,
    pendingBookingCountAgg,
    featuredServicesSnap,
    recentProjectsSnap,
    recentProductsSnap,
    recentBookingsSnap,
    recentResultsSnap,
    pendingBookingsSnap,
    paidBookingsSnap,
    reviewStatsSnap,
  ] = await Promise.all([
    adminDb.collection('projects').count().get(),
    adminDb.collection('products').count().get(),
    adminDb.collection('services').count().get(),
    adminDb.collection('reviews').count().get(),
    adminDb.collection('bookings').count().get(),
    adminDb.collection('results').count().get(),
    adminDb.collection('bookings').where('status', '==', 'pending').count().get(),
    adminDb.collection('services').where('highlight', '==', true).get(),
    adminDb.collection('projects').orderBy('created_at', 'desc').limit(5).get(),
    adminDb.collection('products').orderBy('created_at', 'desc').limit(5).get(),
    adminDb.collection('bookings').orderBy('created_at', 'desc').limit(6).get(),
    adminDb.collection('results').orderBy('created_at', 'desc').limit(5).get(),
    // equality-only filter — no composite index required; sorted in JS below
    adminDb.collection('bookings').where('status', '==', 'pending').limit(5).get(),
    adminDb.collection('bookings').where('payment_status', '==', 'paid').select('payment_amount').get(),
    adminDb.collection('reviews').where('status', '==', 'approved').get(),
  ]);

  const projectCount = projectCountAgg.data().count;
  const productCount = productCountAgg.data().count;
  const serviceCount = serviceCountAgg.data().count;
  const reviewCount = reviewCountAgg.data().count;
  const bookingCount = bookingCountAgg.data().count;
  const resultCount = resultCountAgg.data().count;
  const pendingBookingCount = pendingBookingCountAgg.data().count;

  const featuredServices = featuredServicesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const recentProjects = recentProjectsSnap.docs.map((doc) => {
    const d = doc.data() as { title: string; created_at: string };
    return { id: doc.id, title: d.title, created_at: d.created_at };
  });

  const recentProducts = recentProductsSnap.docs.map((doc) => {
    const d = doc.data() as { name: string; created_at: string };
    return { id: doc.id, name: d.name, created_at: d.created_at };
  });

  const recentBookings = recentBookingsSnap.docs.map((doc) => {
    const d = doc.data() as { name: string; booking_type: DbBookingType; created_at: string };
    return { id: doc.id, name: d.name, booking_type: d.booking_type, created_at: d.created_at };
  });

  const recentResults = recentResultsSnap.docs.map((doc) => {
    const d = doc.data() as { created_at: string };
    return { id: doc.id, created_at: d.created_at };
  });

  const pendingBookings = pendingBookingsSnap.docs
    .map((doc) => {
      const d = doc.data() as {
        name: string;
        booking_type: DbBookingType;
        preferred_date: string;
        created_at: string;
      };
      return { id: doc.id, name: d.name, booking_type: d.booking_type, preferred_date: d.preferred_date, created_at: d.created_at };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const revenueCentavos = paidBookingsSnap.docs.reduce((sum, doc) => {
    const d = doc.data() as { payment_amount: number | null };
    return sum + (d.payment_amount ?? 0);
  }, 0);
  const paidCount = paidBookingsSnap.size;

  const recentActivity = [
    ...recentProjects.map((p) => ({ title: p.title, created_at: p.created_at, type: 'project' as ActivityType })),
    ...recentProducts.map((p) => ({ title: p.name, created_at: p.created_at, type: 'product' as ActivityType })),
    ...recentBookings.map((b) => ({
      title: `${b.name} · ${BOOKING_TYPE_LABELS[b.booking_type ?? 'consultation']}`,
      created_at: b.created_at,
      type: 'booking' as ActivityType,
    })),
    ...recentResults.map((r) => ({ title: 'Before/After result', created_at: r.created_at, type: 'result' as ActivityType })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const avgRating =
    reviewStatsSnap.docs.length > 0
      ? (
          reviewStatsSnap.docs.reduce((sum, doc) => sum + ((doc.data() as { rating: number }).rating ?? 0), 0) /
          reviewStatsSnap.docs.length
        ).toFixed(1)
      : null;

  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-6 gap-4 flex-1">
        {/* Welcome banner: col-span-2 row-span-2 */}
        <div
          className="col-span-2 row-span-2 bg-navy-950 rounded-2xl p-6 flex flex-col justify-between min-h-[200px]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-solar-500" />
              <span className="text-xs uppercase tracking-widest font-bold text-white/40">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-1">JMC Solar PH</h1>
            <p className="text-white/50 text-sm">Manage your content from here.</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-white/30 text-xs">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <a
              href="/"
              target="_blank"
              className="text-solar-400/70 hover:text-solar-400 text-xs flex items-center gap-1 transition-colors"
            >
              View live site
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 9L9 1M9 1H3M9 1V7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Stat cards — ordered by importance */}
        <StatCard
          count={bookingCount ?? 0}
          label="Bookings"
          accent="bg-emerald-500"
          secondary={pendingBookingCount > 0 ? `${pendingBookingCount} pending` : 'none pending'}
          secondaryClass={pendingBookingCount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}
          href="/admin/bookings"
        />
        <StatCard
          count={resultCount ?? 0}
          label="Results"
          accent="bg-cyan-500"
          secondary="before / after gallery"
          href="/admin/results"
        />
        <StatCard
          count={projectCount ?? 0}
          label="Projects"
          accent="bg-solar-500"
          secondary="residential · commercial · more"
          href="/admin/projects"
        />
        <StatCard
          count={productCount ?? 0}
          label="Products"
          accent="bg-blue-500"
          secondary="across multiple categories"
          href="/admin/products"
        />
        <StatCard
          count={serviceCount ?? 0}
          label="Services"
          accent="bg-teal-500"
          secondary={`${featuredServices?.length ?? 0} featured`}
          href="/admin/services"
        />
        <StatCard
          count={reviewCount ?? 0}
          label="Reviews"
          accent="bg-violet-500"
          secondary={avgRating ? `★ ${avgRating} avg rating` : 'no ratings yet'}
          href="/admin/reviews"
        />

        {/* Revenue summary: col-span-2 (fills row 2, cols 5-6) */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          <div className="h-1 w-full bg-green-500" />
          <div className="p-5">
            <p className="text-3xl font-black text-navy-950 leading-none">{formatCentavos(revenueCentavos)}</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">Revenue Collected</p>
            <p className="text-xs text-slate-400 mt-1">
              {paidCount} paid booking{paidCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Needs attention: pending bookings — col-span-4 */}
        <div className="col-span-4 bg-amber-50/40 rounded-2xl border border-amber-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Needs Attention</p>
            <Link href="/admin/bookings" className="text-xs text-amber-700 hover:text-amber-600 transition-colors">
              View all →
            </Link>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">All caught up — no pending bookings.</p>
          ) : (
            <div className="space-y-2">
              {pendingBookings.map((b) => (
                <Link
                  key={b.id}
                  href="/admin/bookings"
                  className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-amber-100/50 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-sm text-navy-900 font-medium flex-1 truncate">{b.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                    {BOOKING_TYPE_LABELS[b.booking_type ?? 'consultation']}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{b.preferred_date || '—'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions: col-span-2 (fills row 3, cols 5-6) */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
          <div className="space-y-1">
            {[
              { label: 'New Project', href: '/admin/projects/new', icon: '📁' },
              { label: 'New Product', href: '/admin/products/new', icon: '📦' },
              { label: 'New Service', href: '/admin/services/new', icon: '⚙️' },
              { label: 'New Review', href: '/admin/reviews/new', icon: '★' },
              { label: 'New Result', href: '/admin/results/new', icon: '🖼️' },
              { label: 'View Bookings', href: '/admin/bookings', icon: '📅' },
            ].map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-solar-500/5 hover:text-solar-600 text-slate-700 transition-all group"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-solar-500/10 flex items-center justify-center text-sm transition-colors">
                  {icon}
                </span>
                <span className="text-sm font-medium flex-1">{label}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-slate-300 group-hover:text-solar-500 transition-colors"
                >
                  <path
                    d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity: col-span-6 */}
        <div className="col-span-6 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Activity</p>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <Link
                  key={i}
                  href={ACTIVITY_HREF[item.type]}
                  className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ACTIVITY_STYLES[item.type].dot}`} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTIVITY_STYLES[item.type].badge}`}>
                    {item.type}
                  </span>
                  <span className="text-sm text-slate-700 font-medium flex-1 truncate">{item.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{getRelativeTime(item.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
