export default function CustomerDetailLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading customer">
      <div className="h-20 animate-pulse rounded-lg bg-slate-800/80" />
      <div className="h-40 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="h-56 animate-pulse rounded-xl bg-slate-800/80" />
    </div>
  );
}
