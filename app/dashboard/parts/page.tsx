import Link from "next/link";
import { redirect } from "next/navigation";
import { PartsCatalogClient } from "@/components/parts/parts-catalog-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listCompanyPartsForPage } from "@/lib/parts/serialize";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const partsResult = await listCompanyPartsForPage(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts inventory"
        description="Company-wide parts catalog and stock on hand. Work orders draw from this inventory when marked completed."
        actions={
          <Link
            href="/dashboard/work-orders"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            Work orders
          </Link>
        }
      />
      {partsResult.ok ? (
        <PartsCatalogClient parts={partsResult.parts} />
      ) : (
        <PartsCatalogLoadError message={partsResult.error} />
      )}
    </div>
  );
}

function PartsCatalogLoadError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm leading-6 text-foreground"
    >
      <p className="font-medium">{message}</p>
      <p className="mt-2 text-muted-foreground">
        You can still use work orders — add parts manually on each ticket until the catalog loads.
      </p>
      <Link
        href="/dashboard/work-orders"
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex min-h-11")}
      >
        Open work orders
      </Link>
    </div>
  );
}
