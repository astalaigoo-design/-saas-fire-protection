import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { APP_NAME } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";
import { getDashboardSession } from "@/lib/dashboard/session";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Sign in",
  description: `Sign in to ${APP_NAME}.`,
  path: "/sign-in",
});

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    const session = await getDashboardSession();
    if (session) redirect("/dashboard");
    redirect("/account-setup");
  }

  return <SignInPanel />;
}
