export default function EquipmentImportLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading equipment import">
      <div className="h-10 w-72 rounded-lg bg-muted" />
      <div className="h-48 max-w-3xl rounded-xl bg-muted" />
    </div>
  );
}
