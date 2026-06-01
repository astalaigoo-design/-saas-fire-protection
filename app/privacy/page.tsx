import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

const lastUpdated = "June 1, 2026";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Privacy Policy`,
  description: `Privacy Policy for ${APP_NAME}.`,
  path: "/privacy",
});

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect account information such as name, email address, authentication details, company name, user role, and organization settings.",
      "We collect operational data you enter into the service, including customer records, building records, inspection schedules, checklist responses, notes, photos, signatures, compliance reports, repair quotes, and email recipients.",
      "We may collect technical information such as device type, browser, IP address, log data, and service usage events to operate, secure, and improve the service.",
    ],
  },
  {
    title: "2. How We Use Information",
    body: [
      `We use information to provide ${APP_NAME}, manage accounts, authenticate users, store inspection records, generate reports and quotes, send operational emails, support customers, prevent abuse, and improve reliability.`,
      "We may also use information to comply with legal obligations, enforce our terms, and protect the rights, safety, and security of our users and service.",
    ],
  },
  {
    title: "3. Customer and Inspection Data",
    body: [
      "Your organization controls the customer, building, inspection, photo, signature, report, and quote data entered into the service.",
      "We process this data only as needed to operate the service, support requested workflows, maintain backups, troubleshoot issues, and meet legal or security requirements.",
      "You are responsible for ensuring that your organization has the right to upload and process any personal information or inspection materials submitted to the service.",
    ],
  },
  {
    title: "4. Service Providers",
    body: [
      "We use trusted third-party providers for hosting, database infrastructure, authentication (Clerk), file storage, email delivery, payment and subscription processing (Paddle), analytics, monitoring, and related operations.",
      "Payment information such as card details is collected and processed by Paddle on our behalf. We receive billing status, subscription identifiers, and transaction metadata needed to manage your account and access to the service.",
      "These providers may process information only as needed to provide their services to us and are expected to protect information according to their own security and privacy commitments.",
    ],
  },
  {
    title: "5. Emails and Communications",
    body: [
      "The service may send account, inspection, report, quote, and support emails.",
      "We may send billing-related emails about your trial, subscription, renewals, payment issues, and receipts through Paddle or our operational email provider.",
      "If you send reports or quotes to customers through the service, you are responsible for confirming the recipient address and the content being sent.",
    ],
  },
  {
    title: "6. Security and Retention",
    body: [
      "We use reasonable technical and organizational safeguards designed to protect information from unauthorized access, loss, misuse, or alteration.",
      "No online service is completely secure. We retain information for as long as needed to provide the service, comply with legal obligations, resolve disputes, enforce agreements, and maintain backups.",
    ],
  },
  {
    title: "7. Your Choices",
    body: [
      "Account owners and administrators can update company settings, manage users, and edit many operational records within the service.",
      "You may contact us to request access, correction, export, or deletion of personal information, subject to legal, security, and operational limits.",
    ],
  },
  {
    title: "8. International Processing",
    body: [
      "Information may be processed in countries where we or our service providers operate. These countries may have privacy laws different from those where you are located.",
    ],
  },
  {
    title: "9. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. If changes are material, we will take reasonable steps to notify users through the service or by other appropriate means.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "Questions or requests about this Privacy Policy can be sent to support@getflareflow.com.",
    ],
  },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground shadow-sm sm:p-6">
          <p>
            This policy explains how {APP_NAME} handles information for fire
            inspection companies and their users. It is a practical draft and
            may need legal review before customer rollout.
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
