export default function OrgSettingsLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
