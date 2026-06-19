'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Phone, MapPin } from 'lucide-react';
import type { DbBooking, DbBookingType, DbBookingStatus, DbBookingPaymentStatus } from '@/lib/firebase/types';
import { fetchBookingAction } from '../../bookings/actions';
import { BookingDrawer } from '../../bookings/_components/BookingDrawer';

export type CalEvent = {
  id: string;
  name: string;
  booking_type: DbBookingType;
  preferred_date: string; // YYYY-MM-DD
  preferred_time: string;
  status: DbBookingStatus;
  city_name: string;
  phone: string;
  payment_status: DbBookingPaymentStatus;
};

// One color per service type (the three booking categories).
const TYPE_META: Record<DbBookingType, { label: string; dot: string; chip: string; cell: string }> = {
  consultation: {
    label: 'Consultation',
    dot: 'bg-solar-500',
    chip: 'bg-solar-400/10 text-solar-700 border-solar-400/30',
    cell: 'bg-solar-400/10',
  },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    cell: 'bg-blue-50',
  },
  site_assessment: {
    label: 'Site Assessment',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cell: 'bg-emerald-50',
  },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function CalendarView({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [selected, setSelected] = useState<string | null>(null);

  // Detail drawer: fetch the full booking on demand (calendar holds slim events only).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBooking, setDrawerBooking] = useState<DbBooking | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const openBooking = async (id: string) => {
    setDrawerBooking(null);
    setDrawerLoading(true);
    setDrawerOpen(true);
    const b = await fetchBookingAction(id);
    setDrawerBooking(b);
    setDrawerLoading(false);
  };

  // Group events by their date string for O(1) day lookups.
  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!e.preferred_date) continue;
      const list = map.get(e.preferred_date) ?? [];
      list.push(e);
      map.set(e.preferred_date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.preferred_time || '').localeCompare(b.preferred_time || ''));
    }
    return map;
  }, [events]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build a 6-row grid (leading blanks + days).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setSelected(todayKey);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const selectedEvents = selected ? byDate.get(selected) ?? [] : [];
  const monthCount = events.filter((e) => e.preferred_date?.startsWith(`${year}-${pad(month + 1)}`)).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-navy-900">{MONTHS[month]} {year}</h2>
          <span className="text-xs text-slate-400">{monthCount} this month</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today
          </button>
          <button onClick={goPrev} aria-label="Previous month" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goNext} aria-label="Next month" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 flex-wrap">
        {(Object.keys(TYPE_META) as DbBookingType[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${TYPE_META[t].dot}`} />
            {TYPE_META[t].label}
          </span>
        ))}
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[92px] border-b border-r border-slate-50 bg-slate-50/30" />;
          const key = dateKey(year, month, d);
          const dayEvents = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selected;
          const types = Array.from(new Set(dayEvents.map((e) => e.booking_type)));

          return (
            <button
              key={i}
              onClick={() => setSelected(dayEvents.length ? key : null)}
              className={`min-h-[92px] border-b border-r border-slate-50 p-1.5 text-left align-top transition-colors ${
                isSelected ? 'bg-navy-50/60 ring-1 ring-inset ring-navy-200' : dayEvents.length ? 'hover:bg-slate-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                    isToday ? 'bg-navy-900 text-white' : 'text-slate-600'
                  }`}
                >
                  {d}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">{dayEvents.length}</span>
                )}
              </div>

              {/* Up to 3 event pills, color by service type */}
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-1 text-[10px] leading-tight text-slate-600 truncate"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_META[e.booking_type].dot}`} />
                    <span className="truncate">{e.preferred_time} {e.name}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="flex items-center gap-1 pt-0.5">
                    {types.map((t) => (
                      <span key={t} className={`w-1.5 h-1.5 rounded-full ${TYPE_META[t].dot}`} />
                    ))}
                    <span className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected-day detail */}
      {selected && (
        <div className="border-t border-slate-100 p-5 bg-slate-50/40">
          <p className="text-sm font-bold text-navy-900 mb-3">
            {new Date(selected + 'T00:00:00').toLocaleDateString('en-PH', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
            <span className="ml-2 text-xs font-medium text-slate-400">
              {selectedEvents.length} booking{selectedEvents.length !== 1 ? 's' : ''}
            </span>
          </p>
          <div className="space-y-2">
            {selectedEvents.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => openBooking(e.id)}
                className="w-full text-left flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:shadow-card transition-all cursor-pointer"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_META[e.booking_type].dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy-900 text-sm">{e.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_META[e.booking_type].chip}`}>
                      {TYPE_META[e.booking_type].label}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">{e.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Clock size={11} />{e.preferred_time}</span>
                    <span className="inline-flex items-center gap-1"><Phone size={11} />{e.phone}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{e.city_name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <BookingDrawer
        open={drawerOpen}
        booking={drawerBooking}
        loading={drawerLoading}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
