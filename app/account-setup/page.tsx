import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardSession } from "@/lib/dashboard/session";
import { cn } from "@/lib/utils";

export default async function AccountSetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const session = await getDashboardSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Finish setting up your account
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            You&apos;re signed in, but we couldn&apos;t connect your user to a GetFlareflow workspace
            yet. This usually clears after a refresh, or when stale sign-up metadata is updated.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className={cn(buttonVariants(), "min-h-11")}>
            Try again
          </Link>
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <button type="button" className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full")}>
              Sign out and use a different account
            </button>
          </SignOutButton>
        </div>
        <p className="text-xs text-muted-foreground">
          Still stuck? Email{" "}
          <a href="mailto:support@getflareflow.com" className="text-primary hover:underline">
            support@getflareflow.com
          </a>{" "}
          with the email you used to sign in.
        </p>
      </section>
    </main>
  );
}
