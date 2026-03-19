export default function AdminDashboardLoading() {
  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-6 gap-4 flex-1">
        {/* Welcome banner skeleton */}
        <div className="col-span-2 row-span-2 bg-navy-950/80 rounded-2xl p-6 min-h-[200px] animate-pulse" />

        {/* 4 stat card skeletons */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-1 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
            <div className="h-1 w-full bg-slate-200" />
            <div className="p-5 space-y-2">
              <div className="h-10 w-16 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}

        {/* Quick actions skeleton */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="h-3 w-28 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity skeleton */}
        <div className="col-span-6 bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <div className="h-3 w-28 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
