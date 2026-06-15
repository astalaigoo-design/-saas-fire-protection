import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, DESIGN_PARTNER_APPLY_PATH, PILOT_PRICING } from "@/lib/branding";
import {
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";
import type { SeoLandingPageConfig } from "@/lib/seo/landing-pages";
type SeoLandingPageProps = {
  config: SeoLandingPageConfig;
};

function faqJsonLd(config: SeoLandingPageConfig) {
  if (!config.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function SeoLandingPage({ config }: SeoLandingPageProps) {
  const structuredData = faqJsonLd(config);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <MarketingHeader maxWidth="3xl" priorityLogo showPricing="sm" />

      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="space-y-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← {APP_NAME}
          </Link>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {config.headline}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">{config.subhead}</p>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link href="/sign-up" className={marketingPrimaryCtaClass}>
            Start {TRIAL_DAYS}-day free trial
          </Link>
          <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
            Apply for design partner
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Then {PILOT_PRICING.standard.price}
          {PILOT_PRICING.standard.period} — built for fire protection contractors.
        </p>

        <div className="mt-12 space-y-10">
          {config.sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {config.faqs?.length ? (
          <section aria-labelledby="seo-faq-heading" className="mt-12 space-y-6">
            <h2 id="seo-faq-heading" className="font-heading text-xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <dl className="space-y-5">
              {config.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <dt className="font-heading text-base font-semibold text-foreground">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <aside className="mt-12 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-foreground">Also explore</p>
          <ul className="mt-3 space-y-2">
            {config.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </article>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <nav aria-label="Solutions" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/nfpa-25-inspection-software" className="hover:text-primary">
              NFPA 25 inspection software
            </Link>
            <Link href="/fire-sprinkler-inspection-app" className="hover:text-primary">
              NFPA 25 sprinkler inspection app
            </Link>
            <Link href="/fire-alarm-compliance-reporting-software" className="hover:text-primary">
              Fire alarm compliance reporting
            </Link>
            <Link href="/fire-protection-repair-quoting-software" className="hover:text-primary">
              Fire protection repair quoting
            </Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-primary">
              About
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/refunds" className="hover:text-primary">
              Refunds
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
