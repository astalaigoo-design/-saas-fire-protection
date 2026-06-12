import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, PILOT_PRICING } from "@/lib/branding";
import type { SeoLandingPageConfig } from "@/lib/seo/landing-pages";
import { cn } from "@/lib/utils";

type SeoLandingPageProps = {
  config: SeoLandingPageConfig;
};

export function SeoLandingPage({ config }: SeoLandingPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo logoClassName="size-9" textClassName="text-lg" />
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10")}
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-h-10")}
            >
              Sign in
            </Link>
            <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "min-h-10")}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "min-h-12 justify-center")}
          >
            Start {TRIAL_DAYS}-day free trial
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-12 justify-center",
            )}
          >
            Sign in
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
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-4 gap-y-2 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <Link href="/pricing" className="hover:text-primary">
            Pricing
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
        </div>
      </footer>
    </main>
  );
}
