import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/branding";
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
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {APP_NAME}
          </p>
          <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Fire inspection operations built for busy teams
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {APP_DESCRIPTION}
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {valuePoints.map((point) => (
            <li key={point} className="rounded-lg border border-border bg-card p-4 text-sm">
              {point}
            </li>
          ))}
        </ul>

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

        <p className="text-xs leading-5 text-muted-foreground">
          By creating an account, you agree to the{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/refund" className="text-primary hover:underline">
            Refund Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
