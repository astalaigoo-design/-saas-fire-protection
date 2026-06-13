import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DesignPartnerApplicationForm } from "@/components/marketing/design-partner-application-form";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, PILOT_PRICING } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Apply for design partner — ${APP_NAME}`,
  description:
    "Apply for complimentary GetFlareflow access as an early design partner. Help shape NFPA inspections, reports, and repair quotes for fire protection contractors.",
  path: "/design-partner",
});

export default function DesignPartnerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10 px-4")}
            >
              Pricing
            </Link>
            <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "min-h-10 px-4")}>
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Design partner</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Apply for complimentary pilot access
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          {PILOT_PRICING.designPartner.detail} {PILOT_PRICING.designPartner.limitNote} Submit this
          short form — we&apos;ll email you within one business day. This is separate from{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            starting a {TRIAL_DAYS}-day free trial
          </Link>{" "}
          ({PILOT_PRICING.standard.price}
          {PILOT_PRICING.standard.period} after trial).
        </p>

        <div className="mt-8">
          <DesignPartnerApplicationForm />
        </div>
      </section>
    </main>
  );
}
