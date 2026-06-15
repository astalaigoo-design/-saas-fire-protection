import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, DESIGN_PARTNER_APPLY_PATH, PILOT_PRICING, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import {
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Pricing — ${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} after a ${TRIAL_DAYS}-day free trial`,
  description: `${APP_NAME} pricing: one flat ${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} plan for your whole fire protection company after a ${TRIAL_DAYS}-day free trial. No credit card required to start, cancel anytime.`,
  path: "/pricing",
});

const faqs: { question: string; answer: string | ReactNode }[] = [
  {
    question: `What happens after the ${TRIAL_DAYS}-day free trial?`,
    answer: `Nothing is charged automatically — we don't collect a card at sign-up. When the trial ends, your workspace pauses until you subscribe for ${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} from the billing page. Your customers, buildings, and inspection history are kept the whole time.`,
  },
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. Create an account, add your team, and run real inspections during the trial. You only add billing details if you decide to subscribe.",
  },
  {
    question: `Does ${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period} cover my whole team?`,
    answer:
      "Yes — it's one flat price per company, not per user. Invite your office admins and field technicians without per-seat fees, and that includes every branch you run.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from the billing page whenever you want — access continues until the end of the period you've already paid for. See our refund policy for details.",
  },
  {
    question: "What is the design partner plan?",
    answer: (
      <>
        Free access for 2–3 early fire protection contractors who help shape the product with regular
        feedback.{" "}
        <Link href={DESIGN_PARTNER_APPLY_PATH} className="font-medium text-primary hover:underline">
          Apply for design partner
        </Link>{" "}
        — we review applications within one business day.
      </>
    ),
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MarketingHeader maxWidth="4xl" priorityLogo showPricing={false} />

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Pricing</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            One flat price. No surprises after the trial.
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Every new workspace starts with a {TRIAL_DAYS}-day free trial — no credit card
            required. After that it&apos;s {PILOT_PRICING.standard.price}
            {PILOT_PRICING.standard.period} for your whole company: every admin, every field
            technician, every branch.
          </p>
        </div>

        <PricingCards />
      </section>

      <section
        aria-labelledby="pricing-faq"
        className="border-t border-border/60 bg-card/40 py-14 sm:py-16"
      >
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <h2
            id="pricing-faq"
            className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Pricing questions, answered
          </h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              >
                <dt className="font-heading text-base font-semibold text-foreground">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            More detail in our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/refunds" className="text-primary hover:underline">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Try it on your next inspection
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {TRIAL_DAYS} days free, then {PILOT_PRICING.standard.price}
                {PILOT_PRICING.standard.period}. No card to start.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Link href="/sign-up" className={marketingPrimaryCtaClass}>
                Start free — create account
              </Link>
              <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
                Apply for design partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl space-y-3 px-4 py-8 text-xs leading-5 text-muted-foreground sm:px-6">
          <p>
            Contact support:{" "}
            <a href={`mailto:${PILOT_SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {PILOT_SUPPORT_EMAIL}
            </a>
          </p>
          <nav aria-label="Site links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/" className="text-primary hover:underline">
              Home
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              About
            </Link>
            <Link href={DESIGN_PARTNER_APPLY_PATH} className="text-primary hover:underline">
              Design partner
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
