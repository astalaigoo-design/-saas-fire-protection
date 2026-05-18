import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BuildingNotFound() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h1 className="font-heading text-xl font-semibold text-foreground">Building not found</h1>
      <p className="text-sm text-muted-foreground">
        This site may have been removed or you do not have access to it.
      </p>
      <Link href="/dashboard/customers" className={cn(buttonVariants(), "min-h-11 inline-flex")}>
        Back to customers
      </Link>
    </div>
  );
}
