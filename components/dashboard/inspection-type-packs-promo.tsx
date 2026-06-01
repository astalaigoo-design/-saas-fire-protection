import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InspectionTypePacksData } from "@/lib/companies/inspection-type-queries";

type InspectionTypePacksPromoProps = {
  data: InspectionTypePacksData;
};

export function InspectionTypePacksPromo({ data }: InspectionTypePacksPromoProps) {
  const disabled = data.packs.filter((pack) => !pack.enabled);
  if (disabled.length === 0) return null;

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">
        NFPA checklist packs
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enable wet pipe, dry pipe, fire alarm, kitchen, and other system-specific inspection
        types ({disabled.length} available) — then schedule them like monthly or annual jobs.
      </p>
      <Link
        href="/dashboard/settings#inspection-type-packs"
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex min-h-10")}
      >
        Manage inspection packs
      </Link>
    </section>
  );
}
