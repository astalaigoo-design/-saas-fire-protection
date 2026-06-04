export default function QuotesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-10 w-full max-w-xl rounded-md bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
    </div>
  );
}
