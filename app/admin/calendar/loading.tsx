export default function AdminCalendarLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="h-8 w-32 bg-slate-200 rounded-control animate-pulse" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-card border border-line shadow-soft overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-7">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="min-h-[92px] border-b border-r border-slate-50 p-1.5">
              <div className="h-5 w-5 bg-slate-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
