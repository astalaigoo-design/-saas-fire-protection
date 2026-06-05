import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReportsRegistersSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registers &amp; exports</CardTitle>
        <CardDescription>
          Company-wide CSV downloads for equipment, AHJ / permit tracking, and issued inspection
          certificates. Configure jurisdictions under Organization settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/api/reports/export?type=asset-inventory"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
            prefetch={false}
          >
            Asset inventory (CSV)
          </Link>
          <Link
            href="/api/reports/export?type=ahj-permit-register"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
            prefetch={false}
          >
            AHJ / permit register (CSV)
          </Link>
          <Link
            href="/api/reports/export?type=certificate-register"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
            prefetch={false}
          >
            Certificate register (CSV)
          </Link>
          <Link
            href="/api/reports/export?type=visit-time-mileage"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
            prefetch={false}
          >
            Time &amp; mileage (CSV)
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
