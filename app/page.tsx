import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <div className="max-w-lg text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
          {APP_TAGLINE}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {APP_NAME}
        </h1>
        <p className="mt-4 text-muted-foreground">{APP_DESCRIPTION}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-6")}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-6")}
              >
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-6")}
            >
              Open dashboard
            </Link>
          </SignedIn>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Full-page auth:{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            /sign-in
          </Link>{" "}
          ·{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            /sign-up
          </Link>
        </p>
      </div>
    </main>
  );
}
