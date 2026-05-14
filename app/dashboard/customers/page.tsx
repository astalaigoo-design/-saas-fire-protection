import { getAppRole } from "@/lib/auth/session";
import { ensureCanManageCustomers } from "@/lib/auth/guards";

export default async function CustomersPage() {
  const role = await getAppRole();
  ensureCanManageCustomers(role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <p className="text-slate-400">
        Owners and admins can manage customers. Technicians are redirected to the
        dashboard.
      </p>
    </div>
  );
}
