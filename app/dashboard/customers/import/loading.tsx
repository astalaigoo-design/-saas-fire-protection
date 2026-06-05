export default function CustomerImportLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading customer import">
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-48 max-w-3xl rounded-xl bg-muted" />
    </div>
  );
}
