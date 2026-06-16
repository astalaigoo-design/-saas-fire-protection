import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { cn } from "@/lib/utils";

export function OrgSettingsBillingCard() {
  return (
    <section id="billing" className={orgSectionAnchorClass}>
      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <CardTitle>Billing &amp; subscription</CardTitle>
          <CardDescription>
            View your trial, subscribe with Paddle, or manage your plan and payment method.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link href="/dashboard/billing" className={cn(buttonVariants(), "inline-flex min-h-11")}>
            Open billing
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
