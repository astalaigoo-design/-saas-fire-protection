import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CompetitiveComparisonSection } from "@/components/marketing/competitive-comparison-section";
import { APP_NAME, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import {
  marketingHeaderCtaClass,
  marketingHeaderLinkClass,
} from "@/lib/marketing/cta-classes";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `Compare — ${APP_NAME} vs. fire inspection software`,
  description: `Honest comparison of ${APP_NAME} vs. fire-specialist tools (QuoteIQ, Deelo, Uptick) and enterprise FSM (ServiceTitan, BuildOps). Mobile UX, quoting workflows, AHJ portal transparency, and flat pricing.`,
  path: "/compare",
});

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" priority />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link href="/pricing" className={marketingHeaderLinkClass}>
              Pricing
            </Link>
            <Link href="/sign-in" className={marketingHeaderLinkClass}>
              Sign in
            </Link>
            <Link href="/sign-up" className={marketingHeaderCtaClass}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:pt-12">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← {APP_NAME}
        </Link>
      </div>

      <CompetitiveComparisonSection variant="full" className="py-10 sm:py-12" />

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-8 text-xs leading-5 text-muted-foreground sm:px-6">
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
            <Link href="/pricing" className="text-primary hover:underline">
              Pricing
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              About
            </Link>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </nav>
          <p>© 2026 Flareflow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
