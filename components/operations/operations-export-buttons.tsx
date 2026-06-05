import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OperationsExportButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Link
        href="/api/operations/export?type=bundle"
        className={cn(buttonVariants({ size: "sm" }), "min-h-10")}
        prefetch={false}
      >
        Export compliance bundle (ZIP)
      </Link>
      <p className="text-xs text-muted-foreground">
        Buildings due, equipment due this month, failed checklist items, and permits expiring —
        four CSVs for AHJ / client reporting.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/api/operations/export?type=due"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          prefetch={false}
        >
          Buildings due
        </Link>
        <Link
          href="/api/operations/export?type=equipment-due"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          prefetch={false}
        >
          Equipment due
        </Link>
        <Link
          href="/api/operations/export?type=permits-expiring"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          prefetch={false}
        >
          Permits expiring
        </Link>
        <Link
          href="/api/operations/export?type=deficiencies"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          prefetch={false}
        >
          Failed items
        </Link>
      </div>
    </div>
  );
}
