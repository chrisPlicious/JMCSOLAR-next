export default function AdminBookingsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="h-8 w-32 bg-slate-200 rounded-control animate-pulse" />
        <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Booking cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-card border border-line shadow-soft p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-control bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="space-y-2 shrink-0">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
