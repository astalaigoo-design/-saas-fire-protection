import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-slate-50">
      <div className="max-w-lg text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-amber-400">
          Next.js 14 · Clerk · Prisma · Tailwind
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Saas Fire Protection
        </h1>
        <p className="mt-4 text-slate-400">
          Authentication with roles: owner, admin, technician.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
            >
              Open dashboard
            </Link>
          </SignedIn>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Full-page auth:{" "}
          <Link href="/sign-in" className="text-amber-500 hover:underline">
            /sign-in
          </Link>{" "}
          ·{" "}
          <Link href="/sign-up" className="text-amber-500 hover:underline">
            /sign-up
          </Link>
        </p>
      </div>
    </main>
  );
}
