export default function CustomerPortalLoading() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:py-24">
        <div className="mx-auto h-12 w-48 animate-pulse rounded-xl bg-slate-800" />
        <div className="space-y-2 text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mx-auto h-7 w-56 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-900" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-900" />
      </div>
    </main>
  );
}
