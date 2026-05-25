import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function BillingPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Billing is temporarily disabled while payment setup is being finalized."
      />
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">No payment required</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          GetFlareflow is open for current users without subscription checks or checkout.
          Billing will be added back later when payments are ready.
        </p>
      </section>
    </div>
  );
}
