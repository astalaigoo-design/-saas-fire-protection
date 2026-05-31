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
        description="Your business name, logo, and contact details on compliance PDF reports. Report email also receives inspection due-date reminders 7 days ahead."
      />
      <CompanySettingsForm company={company} />
    </div>
  );
}
