export default function AdminReviewsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-28 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_24px_0_rgb(0_0_0/0.06)]">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-6">
          {['w-24', 'w-16', 'w-16', 'w-40', 'w-20'].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-200 rounded animate-pulse`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
