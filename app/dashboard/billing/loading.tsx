export default function BillingLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading billing">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
