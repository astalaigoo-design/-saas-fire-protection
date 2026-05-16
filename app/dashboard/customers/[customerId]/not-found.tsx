import Link from "next/link";

export default function CustomerNotFound() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold text-white">Customer not found</h1>
      <p className="text-slate-400">
        This customer does not exist or is not part of your company.
      </p>
      <Link
        href="/dashboard/customers"
        className="inline-flex min-h-11 items-center text-sm font-medium text-amber-400 hover:underline"
      >
        ← Back to customers
      </Link>
    </div>
  );
}
