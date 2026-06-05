import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { OutboundEmailInlineNotice } from "@/components/dashboard/outbound-email-inline-notice";
import { RepairInvoicesList } from "@/components/repair-invoices/repair-invoices-list";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanManageJobs } from "@/lib/auth/guards";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getOutboundChannelsStatus } from "@/lib/outbound/channels";
import { listCompanyRepairInvoicesSafe } from "@/lib/repair-invoices/queries";
import { cn } from "@/lib/utils";

export default async function RepairInvoicesPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanManageJobs(session.role);

  const { invoices, schemaReady } = await listCompanyRepairInvoicesSafe(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair invoices"
        description="Customer billing for accepted repair quotes — PDF invoices and payment tracking. Not your Flareflow subscription (Paddle) or QuickBooks sync."
        actions={
          <Link
            href="/dashboard/quotes?stage=accepted"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
          >
            Accepted quotes
          </Link>
        }
      />

      <OutboundEmailInlineNotice channels={getOutboundChannelsStatus()} context="quotes" />

      {!schemaReady ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          Repair invoices are temporarily unavailable while the database finishes updating.
        </p>
      ) : (
        <RepairInvoicesList invoices={invoices} />
      )}
    </div>
  );
}
