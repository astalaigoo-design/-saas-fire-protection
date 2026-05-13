export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-slate-50">
      <div className="max-w-lg text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-amber-400">
          Next.js 14 · App Router · TypeScript · Tailwind
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Saas Fire Protection
        </h1>
        <p className="mt-4 text-slate-400">
          Run <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">npm run dev</code>{" "}
          and open{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
            http://localhost:3000
          </code>
          .
        </p>
      </div>
    </main>
  );
}
