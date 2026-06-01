import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { productShowcase } from "@/components/marketing/product-previews";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_POSITIONING, APP_TAGLINE, PILOT_PRICING, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import { cn } from "@/lib/utils";

const workflowSteps = [
  {
    step: "1",
    title: "Schedule",
    body: "Monthly, quarterly, or annual jobs with NFPA checklist items created automatically.",
  },
  {
    step: "2",
    title: "Inspect",
    body: "Technicians complete the checklist on mobile — offline when the signal drops.",
  },
  {
    step: "3",
    title: "Report",
    body: "Compliance PDF with citations, photos, and signature — emailed on submit.",
  },
  {
    step: "4",
    title: "Quote",
    body: "Failed items become draft repair quotes ready for owner review and send.",
  },
] as const;

const nfpaHighlights = [
  "Checklists cite exact NFPA standard, edition, and section",
  "Monthly, quarterly, and annual cadences built in",
  "Recurring jobs auto-schedule after submit",
  "Due-date email reminders 7 days ahead",
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10 px-4")}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "sm" }), "min-h-10 px-4")}
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)] lg:items-center lg:gap-12">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {APP_TAGLINE}
            </p>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              {APP_POSITIONING}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Built for fire protection contractors — not generic scheduling software. One workflow
              from the truck to the client inbox.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "lg" }), "min-h-12 px-8 text-base")}
              >
                Start free — create account
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-12 px-8 text-base",
                )}
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            {productShowcase[0]?.preview}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              See the product
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Field inspection, compliance reporting, and repair quoting — connected in one system.
            </p>
          </div>

          <ul className="mt-10 grid gap-8 lg:grid-cols-3">
            {productShowcase.map((item) => (
              <li
                key={item.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-5 flex min-h-[220px] items-center justify-center rounded-xl bg-muted/30 p-4">
                  {item.preview}
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          One connected workflow
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((item) => (
            <li
              key={item.step}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {item.step}
              </span>
              <h3 className="mt-3 font-heading text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-center">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                NFPA-native, not bolted on
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Checklist items ship with the exact code citations your team and AHJs expect — not
                generic task lists you have to maintain yourself.
              </p>
              <ul className="mt-6 space-y-3">
                {nfpaHighlights.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6 text-foreground">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Example checklist item
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Sprinkler heads free of obstruction
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                NFPA 25 (2023) §5.2.1 — Sprinklers shall be free of corrosion, foreign material,
                paint, and physical damage; maintain minimum clearance below deflectors per
                §5.2.1.1.1.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Pricing</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Simple monthly pricing
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {TRIAL_DAYS}-day free trial, then {PILOT_PRICING.standard.price}
            {PILOT_PRICING.standard.period}. Design partners on the pilot may qualify for free
            access — contact us before subscribing.
          </p>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          <li className="flex flex-col rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {PILOT_PRICING.standard.label}
            </p>
            <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
              {PILOT_PRICING.standard.price}
              <span className="text-lg font-medium text-muted-foreground">
                {PILOT_PRICING.standard.period}
              </span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {PILOT_PRICING.standard.detail}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Includes {TRIAL_DAYS}-day free trial for new workspaces.
            </p>
          </li>

          <li className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {PILOT_PRICING.designPartner.label}
            </p>
            <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
              {PILOT_PRICING.designPartner.price}
              <span className="text-lg font-medium text-muted-foreground">
                {PILOT_PRICING.designPartner.period}
              </span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {PILOT_PRICING.designPartner.detail}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              {PILOT_PRICING.designPartner.limitNote}
            </p>
          </li>
        </ul>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Questions or to join the pilot?{" "}
          <a
            href={`mailto:${PILOT_SUPPORT_EMAIL}?subject=GetFlareflow%20pilot%20pricing`}
            className="font-medium text-primary hover:underline"
          >
            {PILOT_SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Run your next inspection in GetFlareflow
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Create your workspace, add a customer and building, schedule a job, and complete the
                full field-to-report workflow on your phone. {TRIAL_DAYS}-day free trial, then{" "}
                {PILOT_PRICING.standard.price}
                {PILOT_PRICING.standard.period}.
              </p>
            </div>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-12 shrink-0 px-8 text-base lg:min-w-[200px]",
              )}
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-8 text-xs leading-5 text-muted-foreground sm:px-6">
          <p>
            Contact support:{" "}
            <a href="mailto:support@getflareflow.com" className="text-primary hover:underline">
              support@getflareflow.com
            </a>
          </p>
          <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link href="/refunds" className="text-primary hover:underline">
              Refund Policy
            </Link>
          </nav>
          <p>© 2026 Flareflow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
