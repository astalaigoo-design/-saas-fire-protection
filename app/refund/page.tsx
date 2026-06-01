import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, PILOT_PRICING } from "@/lib/branding";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const lastUpdated = "June 1, 2026";

const standardPlanPrice = `${PILOT_PRICING.standard.price}${PILOT_PRICING.standard.period}`;

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Refund Policy`,
  description: `Refund Policy for ${APP_NAME}.`,
  path: "/refund",
});

const sections = [
  {
    title: "Introduction",
    body: [
      "Thank you for purchasing a product from Paddle.",
      `Paddle acts as the authorised reseller for purchases of ${APP_NAME} and other digital products supplied by software developers (“Suppliers”). ${APP_NAME} is the Supplier of the software you access through this service.`,
      "This Policy explains when you may withdraw a transaction and/or receive a refund, and how to request one. It applies to transactions completed by consumers and businesses.",
      "If local consumer protection laws or the Supplier of a product provides you with additional or non-waivable rights, the highest level of rights will always apply. Nothing in this Policy limits your mandatory consumer rights.",
      "For questions about this Policy or to request a refund, visit Paddle Buyer support at https://paddle.net.",
      "This Policy forms part of the Paddle Buyer Terms and Conditions and is subject to their terms and definitions. If there is any inconsistency, the Paddle Buyer Terms and Conditions will apply.",
    ],
  },
  {
    title: "1. Global Refund Policy",
    body: [
      "Unless required by applicable law, all transactions are non-refundable and non-exchangeable.",
      "Paddle may issue refunds on a discretionary basis (see section 7 below) or if you exercise an applicable statutory withdrawal or refund right (see section 2 below).",
      "Refunds will not be issued where there is evidence of fraud, refund abuse, or other manipulative behaviour.",
      "This Policy does not affect consumer rights in relation to products that are not as described, faulty, or not fit for purpose (see section 4 below).",
      "Refund requests must be made within the applicable statutory or discretionary period described below.",
      "If you receive a refund in accordance with this Policy, access to the relevant product will cease.",
    ],
  },
  {
    title: "2. Country-Specific Rules",
    body: [
      "Where local consumer protection laws grant unconditional withdrawal rights, those rights apply and override this Policy and any Supplier policy. Where regional differences apply, Paddle applies the highest standard of protection across the relevant country, as reflected below.",
      "European Union / EEA / Switzerland / United Kingdom: Consumers have a 14-day statutory right to withdraw from some digital content and service contracts and receive a full refund. The right applies to one-off purchases and to the first payment under a subscription contract. It does not apply to subsequent subscription payments, except as described in the next sentence. If a subscription includes a free trial period, then as soon as that free trial period ends you will again have a period of 14 calendar days to exercise your right to withdraw. If you completed a transaction in the UK and have an annual subscription, you will have a new period of 14 calendar days to exercise your right to withdraw starting the day the subscription auto-renews for another year. The right to withdraw does not apply to digital content that has started to be downloaded, streamed, or otherwise used when you have given express consent to waive your withdrawal rights. To exercise this right, you must request a refund within 14 days from the date of the transaction (see section 3 below).",
      "Turkey / Israel: Consumers have a 14-day statutory right to withdraw from some digital content and service contracts and receive a full refund. To exercise this right, you must request a refund within 14 days from the date of the transaction (see section 3 below).",
      "South Korea / Brazil / China: Consumers have a 7-day unconditional right to cancel digital content or service contracts after delivery and receive a full refund. To exercise this right, you must request a refund within 7 days from the date of the transaction (see section 3 below).",
      "Canada: Consumers have a 7-day unconditional right to cancel digital content or service contracts after delivery and receive a full refund. To exercise this right, you must request a refund within 7 days from the date of the transaction (see section 3 below). You acknowledge having received access to a French version of this Policy.",
      "Singapore: Consumers have a 5-day unconditional right to cancel digital content or services after delivery or first access and receive a full refund. To exercise this right, you must request a refund within 5 days from the date of the transaction (see section 3 below).",
    ],
  },
  {
    title: "3. How to Withdraw and Request a Refund",
    body: [
      "To withdraw, cancel, and/or request a refund, contact Paddle using one of the following methods: use the “View receipt” or “Manage subscription” link in your transaction confirmation email; submit a request via the support link in your receipt or within your account billing page; or visit https://paddle.net and select the “Request refund” option.",
      "If eligible, refunds will be processed using the same payment method where possible and within 14 days of approval of the request.",
      "Paddle’s transaction records will be used to verify eligibility and timing but will not override your statutory rights.",
      "If you are not sure of the details of your transaction or whether you are eligible for a refund, contact Paddle at https://paddle.net and they will assist you.",
      "If a transaction is not eligible for a refund, you may still cancel the subscription at any time to prevent future billing. Cancellation takes effect at the end of the current billing period and prevents further payments.",
      `For product support questions about ${APP_NAME}, you may contact support@getflareflow.com. Refund processing remains with Paddle as Merchant of Record.`,
    ],
  },
  {
    title: "4. Refunds for Technical or Product Defects",
    body: [
      `If you experience persistent technical issues with ${APP_NAME} or a material defect that prevents you from accessing features as described, contact ${APP_NAME} support at support@getflareflow.com first to attempt to resolve the issue.`,
      "If the issue cannot be resolved, contact Paddle’s support team (see section 3 above) and provide details of the issue and any response received from the Supplier.",
      "Where there is evidence of a material technical or product defect, Paddle will issue a refund in accordance with applicable consumer protection laws.",
    ],
  },
  {
    title: "5. Add-Ons and One-Time Transactions",
    body: [
      "Add-ons linked to a main subscription expire when the main subscription ends, unless otherwise stated.",
      "Refund eligibility for add-ons and one-time transactions follows the same criteria as the main transaction, unless local law provides otherwise.",
      "Items that are delivered and fully accessible immediately may be non-refundable once delivered, except where required by law.",
    ],
  },
  {
    title: "6. Chargebacks and Payment Disputes",
    body: [
      "We encourage you to contact Paddle before raising a chargeback or payment dispute with your bank, card issuer, or other payment provider.",
      "If you initiate a chargeback or payment reversal, access to the relevant product may be temporarily suspended while the matter is reviewed.",
      "On receipt of the chargeback or dispute, Paddle will provide the payment provider with payment details and, where relevant, your consent to waive statutory rights.",
      "This does not affect your lawful rights to dispute a charge under card-scheme or consumer-protection rules.",
    ],
  },
  {
    title: "7. Discretionary Refunds",
    body: [
      "Paddle may, at its sole discretion, issue a refund if a request is submitted within 14 days of your transaction date. Submission of a request within this 14-day period does not guarantee a refund.",
      "All refund requests are reviewed on a case-by-case basis. Paddle may consider relevant factors including the nature of the product, the reason for the request, usage or consumption, and any applicable contractual terms. Paddle may approve a refund in full, approve a partial refund, or decline the request.",
      "Any discretionary refund granted by Paddle is voluntary and does not create an obligation to provide refunds in the future, including for similar requests.",
    ],
  },
  {
    title: "8. Free Trial and Subscription Price",
    body: [
      `${APP_NAME} offers a ${TRIAL_DAYS}-day free trial for new workspaces. Unless you have a separate written agreement (for example, a limited design-partner program), paid service is ${standardPlanPrice} after the trial. Trial and subscription terms are shown at sign-up, checkout, and in your dashboard.`,
      `When a subscription includes a ${TRIAL_DAYS}-day free trial, statutory withdrawal rights in the European Union / EEA / Switzerland / United Kingdom apply again for 14 calendar days after the free trial ends, as described in section 2.`,
      "Cancel before the trial ends if you do not want to continue on a paid plan. After the trial converts to a paid subscription, refund eligibility follows sections 1–7 above.",
    ],
  },
  {
    title: "9. Updates to this Policy",
    body: [
      "Paddle may update this Policy from time to time.",
      "The version in effect at the time of your transaction governs that transaction. We recommend saving or printing a copy for your records.",
    ],
  },
  {
    title: "10. Governing Law and Disputes",
    body: [
      "This Policy is subject to the governing law, complaints, and disputes provisions set out in the Paddle Buyer Terms and Conditions.",
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
            Our order process is conducted by our online reseller Paddle.com.
            Paddle.com is the Merchant of Record for all paid {APP_NAME} orders.
            Paddle provides payment support, tax handling, invoices, subscription
            billing, and refund processing.
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
