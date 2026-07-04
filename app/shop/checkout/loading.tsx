export default function CheckoutLoading() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4 min-h-[70vh]">
      <div className="max-w-4xl mx-auto">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-10 w-56 bg-slate-200 rounded animate-pulse mb-8" />
        <div className="grid lg:grid-cols-[1fr_20rem] gap-8 items-start">
          <div className="space-y-6">
            <div className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="h-80 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
