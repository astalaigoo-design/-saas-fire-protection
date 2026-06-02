import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit/apply";

function clerkPublishableKeyHelp(): NextResponse {
  return new NextResponse(
    [
      "Clerk configuration error",
      "",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be your Publishable key (starts with pk_test_ or pk_live_).",
      "Do not paste your Secret key (sk_test_ / sk_live_) into that variable.",
      "",
      "Fix: Clerk Dashboard → your app → Configure → API Keys → copy “Publishable key” into .env on the NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY line, save, restart `npm run dev`.",
    ].join("\n"),
    {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}

function clerkPublishableKeyMissing(): NextResponse {
  return new NextResponse(
    [
      "Clerk configuration error",
      "",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is empty.",
      "",
      "Fix: Clerk Dashboard → API Keys → copy the Publishable key (pk_test_... or pk_live_...) into .env, save, restart `npm run dev`.",
    ].join("\n"),
    {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/nfpa-25-inspection-software",
  "/fire-sprinkler-inspection-app",
  "/terms",
  "/privacy",
  "/refund",
  "/refunds",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/account-setup",
  // Public customer links (no Clerk sign-in)
  "/r/(.*)",
  "/q/(.*)",
  "/api/public/reports/(.*)",
  "/api/public/quotes/(.*)",
  "/api/webhooks/clerk",
  "/api/webhooks/paddle",
  "/api/cron/due-reminders",
  "/api/cron/trial-ending-reminders",
  "/api/cron/cleanup-idempotency",
  "/monitoring",
  "/opengraph-image",
  "/twitter-image",
]);

export default clerkMiddleware(async (auth, request) => {
  const rateLimited = await applyRateLimit(request);
  if (rateLimited) return rateLimited;

  const pk = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").trim();

  if (!pk) {
    return clerkPublishableKeyMissing();
  }
  if (pk.startsWith("sk_test_") || pk.startsWith("sk_live_")) {
    return clerkPublishableKeyHelp();
  }
  if (!pk.startsWith("pk_test_") && !pk.startsWith("pk_live_")) {
    return clerkPublishableKeyHelp();
  }

  if (!isPublicRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
