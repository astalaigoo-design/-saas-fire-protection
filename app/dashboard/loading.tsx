export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-16 animate-pulse rounded-lg bg-slate-800/80" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/80" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-slate-800/80" />
    </div>
  );
}
