import { redirect } from "next/navigation";
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { ensureCanManageOrgSettings } from "@/lib/auth/guards";
import { getCompanyProfile } from "@/lib/companies/queries";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function OrgSettingsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageOrgSettings(session.role);

  const company = await getCompanyProfile(session);
  if (!company) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Your inspection business name and details on PDF reports. This is not the same as a customer you inspect for."
      />
      <CompanySettingsForm company={company} />
    </div>
  );
}
