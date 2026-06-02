import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignUpPanel } from "@/components/auth/sign-up-panel";
import { APP_NAME } from "@/lib/branding";
import { buildPublicPageMetadata } from "@/lib/seo/site-metadata";
import { getDashboardSession } from "@/lib/dashboard/session";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Sign up",
  description: `Create your ${APP_NAME} account and start your free trial.`,
  path: "/sign-up",
});

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    const session = await getDashboardSession();
    if (session) redirect("/dashboard");
    redirect("/account-setup");
  }

  return <SignUpPanel />;
}
