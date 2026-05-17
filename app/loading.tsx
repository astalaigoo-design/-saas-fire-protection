export default function AppLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-slate-950 px-4"
      aria-busy="true"
    >
      <div className="w-full max-w-md space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-slate-800/80" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
      </div>
    </main>
  );
}
