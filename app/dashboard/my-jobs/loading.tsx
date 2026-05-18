export default function MyJobsLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
