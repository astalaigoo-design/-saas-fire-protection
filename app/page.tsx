import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

const valuePoints = [
  "Smart scheduling and recurring inspection planning",
  "Customer and building records in one place",
  "Mobile-first field workflow for technicians",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
        <div className="rounded-3xl border border-primary/20 bg-card/80 p-5 shadow-lg shadow-primary/5 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo
              logoClassName="size-20 rounded-3xl shadow-md shadow-primary/15"
              textClassName="text-3xl sm:text-4xl"
            />
            <div className="max-w-xs text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {APP_TAGLINE}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Professional compliance software for fire protection teams.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Automated Fire Protection Compliance & Asset Tracking
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Streamline NFPA field inspections, track asset maintenance, and generate instant
            repair quotes for commercial facilities.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {valuePoints.map((point) => (
            <li key={point} className="rounded-lg border border-border bg-card p-4 text-sm">
              {point}
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Simple pricing
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                $49 / month
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Includes scheduling, customer and building records, mobile field
                inspections, compliance reports, and repair quote workflows.
              </p>
              <p className="text-sm font-medium text-foreground">
                Start your 14-day free trial. No credit card required.
              </p>
            </div>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-6")}
            >
              Start free trial
            </Link>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-6")}>
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-6")}
          >
            Create account
          </Link>
        </div>

        <div className="space-y-2 text-xs leading-5 text-muted-foreground">
          <p>
            Contact Support:{" "}
            <a href="mailto:support@getflareflow.com" className="text-primary hover:underline">
              support@getflareflow.com
            </a>
          </p>
          <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
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
      </section>
    </main>
  );
}
