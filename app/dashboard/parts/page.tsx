import Link from "next/link";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { listCompanyPartsForPage } from "@/lib/parts/serialize";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

const PartsCatalog = dynamic(
  () => import("@/components/parts/parts-catalog").then((m) => m.PartsCatalog),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading parts catalog">
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    ),
  },
);

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
        <PartsCatalog parts={partsResult.parts} />
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
