import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";
import { ensureCanManageCustomers } from "@/lib/auth/guards";

export default async function NewCustomerPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">New customer</h1>
      <p className="text-slate-400">
        Customer form coming soon. For now, manage customers from the list.
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
