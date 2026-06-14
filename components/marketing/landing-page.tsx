import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import {
  HowItWorksSection,
  howItWorksJsonLd,
} from "@/components/marketing/how-it-works-section";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { AboutSection } from "@/components/marketing/about-section";
import { CompetitiveComparisonSection } from "@/components/marketing/competitive-comparison-section";
import { productShowcase, ProductShowcaseImage } from "@/components/marketing/product-previews";
import {
  marketingHeaderCtaClass,
  marketingHeaderLinkClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import {
  APP_POSITIONING,
  APP_TAGLINE,
  DESIGN_PARTNER_APPLY_PATH,
  PILOT_PRICING,
  PILOT_SUPPORT_EMAIL,
} from "@/lib/branding";

const nfpaHighlights = [
  "Checklists cite exact NFPA standard, edition, and section",
  "Monthly, quarterly, and annual cadences built in",
  "Recurring jobs auto-schedule after submit",
  "Due-date email reminders 7 days ahead",
] as const;

export function LandingPage() {
  const howToSchema = howItWorksJsonLd();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" priority />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#compare"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Compare
            </Link>
            <Link
              href="#solutions"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Solutions
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link href="/sign-in" className={marketingHeaderLinkClass}>
              Sign in
            </Link>
            <Link href="/sign-up" className={marketingHeaderCtaClass}>
              Start free
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
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-stretch">
              <Link href="/sign-up" className={marketingPrimaryCtaClass}>
                Start free — create account
              </Link>
              <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
                Apply for design partner
              </Link>
            </div>
          </div>

          <div className="hidden max-w-[280px] justify-center lg:flex">
            {productShowcase[0] ? (
              <ProductShowcaseImage item={productShowcase[0]} priority />
            ) : null}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border/60 bg-card/40 py-14 sm:py-16">
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
                <div className="mb-5 overflow-hidden rounded-xl bg-muted/20 p-2">
                  <ProductShowcaseImage
                    item={item}
                    priority={item.imageSrc === productShowcase[0]?.imageSrc}
                  />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HowItWorksSection />

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

      <AboutSection id="about" />

      <CompetitiveComparisonSection />

      <section
        id="solutions"
        aria-labelledby="solutions-heading"
        className="border-y border-border/60 bg-card/40 py-14 sm:py-16"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Solutions</p>
            <h2
              id="solutions-heading"
              className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Built for how fire protection contractors actually work
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Each page goes deeper on a specific workflow — NFPA sprinkler inspections, fire alarm
              compliance reports, and repair quoting from failed items.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/nfpa-25-inspection-software",
                title: "NFPA 25 inspection software",
                description:
                  "Citation-backed sprinkler checklists, compliance PDFs, and deficiency tracking.",
              },
              {
                href: "/fire-sprinkler-inspection-app",
                title: "NFPA 25 sprinkler inspection app",
                description:
                  "Offline mobile inspections with photos, signatures, and client-ready reports.",
              },
              {
                href: "/fire-alarm-compliance-reporting-software",
                title: "Fire alarm compliance reporting",
                description:
                  "NFPA 72 inspections, branded PDFs, certificate numbers, and report links.",
              },
              {
                href: "/fire-protection-repair-quoting-software",
                title: "Fire protection repair quoting",
                description:
                  "Draft quotes from failed items, customer accept online, schedule follow-up work.",
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
                >
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <span className="mt-4 text-sm font-medium text-primary">Learn more →</span>
                </Link>
              </li>
            ))}
          </ul>
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
            {PILOT_PRICING.standard.period}. Want complimentary pilot access?{" "}
            <Link href={DESIGN_PARTNER_APPLY_PATH} className="font-medium text-primary hover:underline">
              Apply for design partner
            </Link>{" "}
            — separate from starting a trial.
          </p>
        </div>

        <PricingCards />

        <p className="mt-4 text-center text-sm">
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            See full pricing details and FAQ →
          </Link>
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
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Link href="/sign-up" className={marketingPrimaryCtaClass}>
                Create account
              </Link>
              <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
                Apply for design partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-8 text-xs leading-5 text-muted-foreground sm:px-6">
          <p>
            Contact support:{" "}
            <a href="mailto:support@getflareflow.com" className="text-primary hover:underline">
              support@getflareflow.com
            </a>
          </p>
          <nav aria-label="Site links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="#features" className="text-primary hover:underline">
              Features
            </Link>
            <Link href="#how-it-works" className="text-primary hover:underline">
              How it works
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              About
            </Link>
            <Link href="/pricing" className="text-primary hover:underline">
              Pricing
            </Link>
            <Link href="/compare" className="text-primary hover:underline">
              Compare
            </Link>
            <Link href={DESIGN_PARTNER_APPLY_PATH} className="text-primary hover:underline">
              Design partner
            </Link>
            <Link href="/nfpa-25-inspection-software" className="text-primary hover:underline">
              NFPA 25 inspection software
            </Link>
            <Link href="/fire-sprinkler-inspection-app" className="text-primary hover:underline">
              NFPA 25 sprinkler inspection app
            </Link>
            <Link
              href="/fire-alarm-compliance-reporting-software"
              className="text-primary hover:underline"
            >
              Fire alarm compliance reporting
            </Link>
            <Link
              href="/fire-protection-repair-quoting-software"
              className="text-primary hover:underline"
            >
              Fire protection repair quoting
            </Link>
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
