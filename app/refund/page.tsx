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
    title: "1. Paddle as Merchant of Record",
    body: [
      `Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for paid ${APP_NAME} orders. Paddle provides payment support, tax handling, invoices, subscription billing, and refund processing.`,
      `When you buy or subscribe to ${APP_NAME} through Paddle, you purchase from Paddle, while ${APP_NAME} supplies and supports the software product.`,
    ],
  },
  {
    title: "2. General Refund Position",
    body: [
      "Unless required by law or approved by Paddle, transactions are generally non-refundable and non-exchangeable once completed.",
      "Paddle may issue refunds on a discretionary basis or where an applicable statutory withdrawal or refund right applies. Refund requests are reviewed case by case and are not guaranteed.",
      "Paddle may refuse a refund request where there is evidence of fraud, refund abuse, or other manipulative behavior.",
    ],
  },
  {
    title: "3. Subscription Cancellations",
    body: [
      "Paid subscriptions renew automatically until canceled. You can cancel from the billing area, through Paddle's subscription management links, or by contacting support.",
      "Cancellation stops future renewals, but unused subscription periods are not refunded unless Paddle approves a refund or applicable law requires one.",
      "If you cancel during a paid billing period, your organization may retain access until the end of that billing period unless access is suspended for a terms, security, or payment issue.",
    ],
  },
  {
    title: "4. Trials and Promotions",
    body: [
      "If a free trial or promotional period is offered, the billing details and renewal terms will be shown during sign-up or checkout.",
      "You are responsible for canceling before the trial or promotional period ends if you do not want to continue on a paid plan.",
    ],
  },
  {
    title: "5. How to Request a Refund",
    body: [
      "To withdraw, cancel, or request a refund, use the View receipt or Manage subscription link in your Paddle transaction confirmation email, use the support link in your receipt or billing page, or visit paddle.net and choose the refund request option.",
      `You may also contact ${APP_NAME} support at support@getflareflow.com. If we agree that a refund should be issued, we will not refund you directly; we will work with Paddle so Paddle can process the refund as Merchant of Record.`,
      "Include your organization name, account email, Paddle order number or invoice reference, and a short description of the issue.",
    ],
  },
  {
    title: "6. Refund Timing and Method",
    body: [
      "If a refund is approved, Paddle will process it using the original payment method where possible. Timing depends on Paddle, the payment method, and your financial institution.",
      "Paddle's published refund policy states that eligible refunds are processed within 14 days of approval where applicable.",
      "Taxes, currency conversion charges, bank fees, and similar third-party charges may be handled according to Paddle's policies and applicable law.",
    ],
  },
  {
    title: "7. Statutory Rights",
    body: [
      "Nothing in this policy limits any mandatory consumer cancellation, withdrawal, refund, or other statutory rights that apply to you.",
      "Paddle's transaction records may be used to verify refund eligibility and timing, but they do not override statutory rights.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      "Billing or refund questions can be sent to support@getflareflow.com. For Paddle order support and refund requests, use your Paddle receipt, Paddle subscription management link, or paddle.net.",
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
            Paid billing is currently disabled. If payments are enabled later,
            this policy explains how refunds, cancellations, trials, and billing
            changes are handled for {APP_NAME} when payments are processed by
            Paddle as Merchant of Record.
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
