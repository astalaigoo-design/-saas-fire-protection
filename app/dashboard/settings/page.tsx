import { getAppRole } from "@/lib/auth/session";
import { ensureCanManageOrgSettings } from "@/lib/auth/guards";

export default async function OrgSettingsPage() {
  const role = await getAppRole();
  ensureCanManageOrgSettings(role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Organization settings</h1>
      <p className="text-slate-400">
        Owner-only area — billing, integrations, or tenant-wide configuration.
      </p>
    </div>
  );
}
