import { redirect } from "next/navigation";
import Link from "next/link";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ensureCanViewBilling } from "@/lib/auth/guards";
import { canManageBilling } from "@/lib/auth/permissions";
import { getCompanyBillingSnapshot } from "@/lib/billing/queries";
import { isPaddleInlineCheckoutReady } from "@/lib/billing/paddle-env";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { PILOT_PRICING, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function BillingPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");
  ensureCanViewBilling(session.role);

  const billing = await getCompanyBillingSnapshot(session, session.email);
  const canManage = canManageBilling(session.role);
  const paddleCheckoutReady = isPaddleInlineCheckoutReady();

  const isDesignPartner = billing?.designPartner ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={
          isDesignPartner
            ? "Your workspace is on the design-partner plan — complimentary pilot access."
            : paddleCheckoutReady
              ? `${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} after your ${TRIAL_DAYS}-day trial — subscribe below.`
              : `${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} after trial — set Paddle price ID to enable checkout.`
        }
      />

      {!canManage ? (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          View-only access. Only the company owner can subscribe or change payment details.
        </p>
      ) : null}

      {billing ? (
        <BillingPanel billing={billing} canManageBilling={canManage} customerEmail={session.email} />
      ) : null}

      {canManage && !isDesignPartner && paddleCheckoutReady ? (
        <section className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Design partner?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If you&apos;re in the pilot cohort, email us before subscribing — we&apos;ll confirm your
            rate.
          </p>
          <Link
            href={`mailto:${PILOT_SUPPORT_EMAIL}?subject=GetFlareflow%20design%20partner%20pricing`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex min-h-10")}
          >
            Contact about pilot access
          </Link>
        </section>
      ) : null}

      {canManage && !isDesignPartner && !paddleCheckoutReady ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-primary/40 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {PILOT_PRICING.standard.label}
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {PILOT_PRICING.standard.price}
                <span className="text-base font-medium text-muted-foreground">
                  {PILOT_PRICING.standard.period}
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {PILOT_PRICING.standard.detail}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {TRIAL_DAYS}-day free trial for new workspaces.
              </p>
            </section>

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
              <p className="mt-2 text-xs text-muted-foreground">
                {PILOT_PRICING.designPartner.limitNote}
              </p>
            </section>
          </div>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Design partner?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              If you&apos;re in the pilot cohort, email us before subscribing — we&apos;ll confirm your
              rate.
            </p>
            <Link
              href={`mailto:${PILOT_SUPPORT_EMAIL}?subject=GetFlareflow%20design%20partner%20pricing`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex min-h-10")}
            >
              Contact about pilot access
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
