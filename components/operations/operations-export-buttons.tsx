import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OperationsExportButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap", className)}>
      <Link
        href="/api/operations/export?type=due"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        prefetch={false}
      >
        Export buildings due (CSV)
      </Link>
      <Link
        href="/api/operations/export?type=equipment-due"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        prefetch={false}
      >
        Export equipment due (CSV)
      </Link>
      <Link
        href="/api/operations/export?type=deficiencies"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        prefetch={false}
      >
        Export failed items (CSV)
      </Link>
    </div>
  );
}
