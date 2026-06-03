import { UserButton } from "@clerk/nextjs";

export function DashboardHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
