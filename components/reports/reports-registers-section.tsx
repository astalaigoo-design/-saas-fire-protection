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
          Company-wide CSV downloads for equipment on file and AHJ / permit tracking per
          building. Edit fire district and permit fields on each building profile.
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
        </div>
      </CardContent>
    </Card>
  );
}
