import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Sign up",
  description: `Create your ${APP_NAME} account and start your free trial.`,
  path: "/sign-up",
});

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <SignUp
        appearance={{ variables: { colorPrimary: "#f59e0b" } }}
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
