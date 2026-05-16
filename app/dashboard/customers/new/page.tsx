import { redirect } from "next/navigation";
import { NewCustomerForm } from "@/components/customers/new-customer-form";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function NewCustomerPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">New customer</h1>
        <p className="mt-1 text-slate-400">Add a client to your company.</p>
      </header>
      <NewCustomerForm />
    </div>
  );
}
