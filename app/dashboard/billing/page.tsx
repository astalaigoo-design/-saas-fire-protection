import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function BillingPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  const billing = await getCompanyBillingSnapshot(session, session.email);
  if (!billing) redirect("/dashboard");

  const isOwner = canManageOrgSettings(session.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={
          isOwner
            ? "Your 14-day free trial and Lemon Squeezy subscription for this organization."
            : "Subscription status for your organization."
        }
      />
      <BillingPanel billing={billing} isOwner={isOwner} />
    </div>
  );
}
