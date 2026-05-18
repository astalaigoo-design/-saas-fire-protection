import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewCustomerForm } from "@/components/customers/new-customer-form";
import { ensureCanManageCustomers } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function NewCustomerPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageCustomers(session.role);

  return (
    <div className="space-y-6">
      <PageHeader title="New customer" description="Add a client to your company." />
      <NewCustomerForm />
    </div>
  );
}
