export default function AdminProjectsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-28 bg-slate-200 rounded-control animate-pulse" />
        <div className="h-9 w-32 bg-slate-200 rounded-control animate-pulse" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-card border border-line shadow-soft p-4 space-y-2">
            <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-card border border-line overflow-hidden shadow-soft">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-8">
          {['w-24', 'w-20', 'w-20', 'w-16'].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-200 rounded animate-pulse`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
            {/* Avatar + title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-slate-100 rounded-control animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
