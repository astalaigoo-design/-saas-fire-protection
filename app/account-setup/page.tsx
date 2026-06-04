import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AccountSetupPanel } from "@/components/auth/account-setup-panel";
import { getDashboardSession } from "@/lib/dashboard/session";
import { provisionUserWorkspace } from "@/lib/dashboard/provision-workspace";

export default async function AccountSetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await getDashboardSession();
  if (existing) redirect("/dashboard");

  const provisioned = await provisionUserWorkspace();
  if (provisioned.ok) redirect("/dashboard");

  const clerkUserIdPrefix = userId.length > 12 ? `${userId.slice(0, 12)}…` : userId;

  return (
    <AccountSetupPanel
      initialError={provisioned.userMessage}
      clerkUserIdPrefix={clerkUserIdPrefix}
    />
  );
}
