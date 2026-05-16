export default function CustomersLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading customers">
      <div className="h-16 animate-pulse rounded-lg bg-slate-800/80" />
      <div className="h-36 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-800/80" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-800/80" />
      </div>
    </div>
  );
}
