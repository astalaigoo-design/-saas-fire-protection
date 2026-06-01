import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Sign in",
  description: `Sign in to ${APP_NAME}.`,
  path: "/sign-in",
});

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <SignIn
        appearance={{ variables: { colorPrimary: "#f59e0b" } }}
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
