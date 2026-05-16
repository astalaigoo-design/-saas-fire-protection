import Link from "next/link";

export default function InspectNotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 p-6">
      <h1 className="text-xl font-semibold text-white">Inspection not found</h1>
      <p className="mt-2 text-slate-400">
        This inspection does not exist or you do not have access.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
