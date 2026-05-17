export default function MyJobsLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-14 animate-pulse rounded-lg bg-slate-800/80" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
    </div>
  );
}
