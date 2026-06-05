export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reports">
      <div className="h-10 w-48 rounded-lg bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
    </div>
  );
}
