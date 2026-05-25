import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/branding";

const lastUpdated = "May 25, 2026";

export const metadata: Metadata = {
  title: `Refund Policy | ${APP_NAME}`,
  description: `Refund Policy for ${APP_NAME}.`,
};

const sections = [
  {
    title: "1. Subscriptions",
    body: [
      `${APP_NAME} is offered as a subscription service for fire inspection businesses. Subscription fees are billed according to the plan, billing interval, and checkout terms shown when you subscribe.`,
      "Unless a separate written agreement says otherwise, subscription payments are non-refundable once a billing period begins.",
    ],
  },
  {
    title: "2. Cancellations",
    body: [
      "You may cancel a paid subscription from the billing area of the service or by contacting support. Cancellation stops future renewals but does not automatically refund the current billing period.",
      "After cancellation, your organization may retain access until the end of the paid billing period, unless access is suspended for a terms, security, or payment issue.",
    ],
  },
  {
    title: "3. Trials and Promotions",
    body: [
      "If a free trial or promotional period is offered, billing details and renewal terms will be shown during sign-up or checkout.",
      "You are responsible for canceling before the trial or promotional period ends if you do not want to continue on a paid plan.",
    ],
  },
  {
    title: "4. Refund Requests",
    body: [
      "We may review refund requests case by case, especially for duplicate charges, billing errors, or accidental renewals reported promptly.",
      "Submitting a refund request does not guarantee approval. Approved refunds may take several business days to appear depending on the payment processor and financial institution.",
    ],
  },
  {
    title: "5. Downgrades and Plan Changes",
    body: [
      "Plan changes may affect available features, limits, and billing. Unless stated otherwise during checkout, downgrades take effect at the next renewal and do not create a refund or credit for the current billing period.",
    ],
  },
  {
    title: "6. Payment Processor Fees and Taxes",
    body: [
      "Payment processor fees, taxes, currency conversion charges, bank fees, and similar third-party charges may be non-refundable where applicable.",
    ],
  },
  {
    title: "7. Contact",
    body: [
      "Refund or billing questions can be sent to support@getflareflow.com. Include your organization name, account email, invoice or payment reference, and a short description of the issue.",
    ],
  },
];

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
        <div className="space-y-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to {APP_NAME}
          </Link>
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {APP_NAME}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Refund Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground shadow-sm sm:p-6">
          <p>
            This policy explains how refunds, cancellations, trials, and billing
            changes are handled for {APP_NAME}. It is a practical draft and may
            need legal review before customer rollout.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
