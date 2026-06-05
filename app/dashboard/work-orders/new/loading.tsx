export default function NewWorkOrderLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading new work order form">
      <div className="h-20 rounded-lg bg-muted" />
      <div className="h-96 max-w-2xl rounded-xl bg-muted" />
    </div>
  );
}
