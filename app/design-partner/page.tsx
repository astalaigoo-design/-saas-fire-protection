import type { Metadata } from "next";
import Link from "next/link";
import { DesignPartnerApplicationForm } from "@/components/marketing/design-partner-application-form";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, PILOT_PRICING } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Apply for design partner — ${APP_NAME}`,
  description:
    "Apply for complimentary GetFlareflow access as an early design partner. Help shape NFPA inspections, reports, and repair quotes for fire protection contractors.",
  path: "/design-partner",
});

export default function DesignPartnerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MarketingHeader
        maxWidth="3xl"
        hideDesignPartner
        showSignIn={false}
        startFreeLabel="Start free trial"
      />

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
