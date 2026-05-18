export default function JobsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading schedule">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
