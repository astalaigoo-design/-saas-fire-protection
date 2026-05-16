export default function InspectLoading() {
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-slate-950 p-4"
      aria-busy="true"
      aria-label="Loading inspection"
    >
      <div className="h-32 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-800/80" />
      <div className="mt-auto h-14 animate-pulse rounded-xl bg-slate-800/80" />
    </div>
  );
}
