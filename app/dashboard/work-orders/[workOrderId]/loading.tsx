export default function WorkOrderDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading work order">
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
    </div>
  );
}
