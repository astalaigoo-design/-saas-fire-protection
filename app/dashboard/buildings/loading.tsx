export default function BuildingsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading buildings">
      <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}
