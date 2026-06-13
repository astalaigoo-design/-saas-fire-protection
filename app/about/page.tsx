import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AboutSection } from "@/components/marketing/about-section";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPublicPageMetadata({
  title: `About — ${APP_NAME}`,
  description: `${APP_NAME} is compliance software built for fire protection contractors — NFPA-native checklists, field-first workflows, and direct access to the team building the product.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10 px-4")}
            >
              Sign in
            </Link>
            <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "min-h-10 px-4")}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 pt-14 sm:px-6 lg:pt-16">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">About</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {APP_TAGLINE}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          {APP_NAME} is vertical software for fire inspection and protection contractors — schedule
          work, run mobile checklists, email compliance PDFs, and close the loop with repair quotes.
        </p>
      </div>

      <AboutSection className="mx-auto w-full max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16" />

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
            <Link href="/pricing" className="text-primary hover:underline">
              Pricing
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
