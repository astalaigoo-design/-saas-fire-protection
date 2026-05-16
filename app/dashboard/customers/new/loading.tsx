export default function NewCustomerLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6" aria-busy="true">
      <div className="h-12 animate-pulse rounded-lg bg-slate-800/80" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-800/80" />
    </div>
  );
}
