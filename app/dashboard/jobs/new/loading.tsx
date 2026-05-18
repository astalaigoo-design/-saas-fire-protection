export default function ScheduleInspectionLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-6" aria-busy="true">
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
