import { adminDb } from '@/lib/firebase/admin';
import { requireAdminAuth } from '@/lib/auth';
import { formatCentavos } from '@/lib/bookings/pricing';
import type { DbBooking, DbBookingType } from '@/lib/firebase/types';
import Link from 'next/link';
import { CalendarDays, Images, FolderOpen, Package, Wrench, Star, Wallet, ExternalLink } from 'lucide-react';
import { CalendarView, type CalEvent } from './calendar/_components/CalendarView';

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
  icon,
  tile,
  secondary,
  secondaryClass = 'text-slate-400',
  href,
}: {
  count: number;
  label: string;
  icon: React.ReactNode;
  tile: string;
  secondary: string;
  secondaryClass?: string;
  href?: string;
}) {
  const inner = (
    <div className="col-span-1 bg-white rounded-2xl border border-slate-100/80 shadow-soft h-full p-5 hover:shadow-card transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tile}`}>{icon}</div>
      <p className="text-4xl font-black text-navy-950 leading-none mt-4">{count}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">{label}</p>
      <p className={`text-xs mt-1 ${secondaryClass}`}>{secondary}</p>
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
    calendarBookingsSnap,
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
    // preferred_date is "YYYY-MM-DD" — lexical order == chronological
    adminDb.collection('bookings').orderBy('preferred_date', 'desc').limit(200).get(),
  ]);

  const calEvents: CalEvent[] = calendarBookingsSnap.docs.map((doc) => {
    const b = doc.data() as DbBooking;
    return {
      id: doc.id,
      name: b.name,
      booking_type: b.booking_type ?? 'consultation',
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      status: b.status,
      city_name: b.city_name,
      phone: b.phone,
      payment_status: b.payment_status,
    };
  });

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
    <div>
      {/* Header strip — no background */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-solar-500" />
            <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black text-navy-950 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            JMC Solar PH
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your content from here.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-slate-400 hidden md:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl shadow-soft transition-colors"
          >
            Visit live site
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-5">
        {/* Needs attention: pending bookings — tall left card (col-span-2 row-span-2) */}
        <div className="col-span-2 row-span-2 bg-amber-50/30 rounded-2xl border border-amber-100/70 shadow-soft p-5">
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

        {/* Stat cards — ordered by importance */}
        <StatCard
          count={bookingCount ?? 0}
          label="Bookings"
          icon={<CalendarDays size={18} />}
          tile="bg-emerald-50 text-emerald-600"
          secondary={pendingBookingCount > 0 ? `${pendingBookingCount} pending` : 'none pending'}
          secondaryClass={pendingBookingCount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}
          href="/admin/bookings"
        />
        <StatCard
          count={resultCount ?? 0}
          label="Results"
          icon={<Images size={18} />}
          tile="bg-cyan-50 text-cyan-600"
          secondary="before / after gallery"
          href="/admin/results"
        />
        <StatCard
          count={projectCount ?? 0}
          label="Projects"
          icon={<FolderOpen size={18} />}
          tile="bg-solar-400/15 text-solar-600"
          secondary="residential · commercial · more"
          href="/admin/projects"
        />
        <StatCard
          count={productCount ?? 0}
          label="Products"
          icon={<Package size={18} />}
          tile="bg-blue-50 text-blue-600"
          secondary="across multiple categories"
          href="/admin/products"
        />
        <StatCard
          count={serviceCount ?? 0}
          label="Services"
          icon={<Wrench size={18} />}
          tile="bg-teal-50 text-teal-600"
          secondary={`${featuredServices?.length ?? 0} featured`}
          href="/admin/services"
        />
        <StatCard
          count={reviewCount ?? 0}
          label="Reviews"
          icon={<Star size={18} />}
          tile="bg-violet-50 text-violet-600"
          secondary={avgRating ? `★ ${avgRating} avg rating` : 'no ratings yet'}
          href="/admin/reviews"
        />

        {/* Revenue summary: col-span-2 (fills row 2, cols 5-6) */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100/80 shadow-soft p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-eco-bg text-green-eco">
            <Wallet size={18} />
          </div>
          <p className="text-3xl font-black text-navy-950 leading-none mt-4">{formatCentavos(revenueCentavos)}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">Revenue Collected</p>
          <p className="text-xs text-slate-400 mt-1">
            {paidCount} paid booking{paidCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Scheduled services calendar: full width */}
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Scheduled Services</p>
            <Link href="/admin/calendar" className="text-xs text-slate-500 hover:text-navy-900 transition-colors">
              Full calendar →
            </Link>
          </div>
          <CalendarView events={calEvents} />
        </div>

        {/* Recent activity: col-span-6 */}
        <div className="col-span-6 bg-white rounded-2xl border border-slate-100/80 shadow-soft p-5">
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
