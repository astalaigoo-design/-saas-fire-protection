import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { getPaddleEnvironment, isPaddleClientConfigured } from "@/lib/billing/paddle-env";
import { PILOT_PRICING, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function BillingPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Early access — full access without checkout. Pilot rates below."
      />

      <section className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Pilot program</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Paid billing is not enabled in the app yet. Current workspaces use the product at no
          charge while we onboard the first fire protection contractors.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {PILOT_PRICING.designPartner.label}
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
            {PILOT_PRICING.designPartner.price}
            <span className="text-base font-medium text-muted-foreground">
              {PILOT_PRICING.designPartner.period}
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {PILOT_PRICING.designPartner.detail}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Limited to 2–3 companies.</p>
        </section>

        <section className="rounded-xl border border-primary/40 bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {PILOT_PRICING.founder.label}
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
            {PILOT_PRICING.founder.price}
            <span className="text-base font-medium text-muted-foreground">
              {PILOT_PRICING.founder.period}
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {PILOT_PRICING.founder.detail}
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">After pilot</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Public plans will launch with a {TRIAL_DAYS}-day free trial. To join the pilot or lock
          founder pricing, email us with your company name and how many technicians you run.
        </p>
        <Link
          href={`mailto:${PILOT_SUPPORT_EMAIL}?subject=GetFlareflow%20pilot%20pricing`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex min-h-10")}
        >
          Contact about pilot pricing
        </Link>
      </section>
    </div>
  );
}
