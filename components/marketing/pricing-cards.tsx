import Link from "next/link";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { DESIGN_PARTNER_APPLY_PATH, PILOT_PRICING } from "@/lib/branding";
import {
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";
import { cn } from "@/lib/utils";

/** Plan cards + CTAs, shared by the homepage pricing section and /pricing. */
export function PricingCards() {
  return (
    <>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        <li className="flex flex-col rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {PILOT_PRICING.standard.label}
          </p>
          <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
            {PILOT_PRICING.standard.price}
            <span className="text-lg font-medium text-muted-foreground">
              {PILOT_PRICING.standard.period}
            </span>
          </p>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
            {PILOT_PRICING.standard.detail}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Includes {TRIAL_DAYS}-day free trial for new workspaces.
          </p>
          <Link href="/sign-up" className={cn(marketingPrimaryCtaClass, "mt-6")}>
            Start free trial
          </Link>
        </li>

        <li className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {PILOT_PRICING.designPartner.label}
          </p>
          <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
            {PILOT_PRICING.designPartner.price}
            <span className="text-lg font-medium text-muted-foreground">
              {PILOT_PRICING.designPartner.period}
            </span>
          </p>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
            {PILOT_PRICING.designPartner.detail}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {PILOT_PRICING.designPartner.limitNote} Apply here — no subscription required to inquire.
          </p>
          <Link href={DESIGN_PARTNER_APPLY_PATH} className={cn(marketingSecondaryCtaClass, "mt-6")}>
            Apply for design partner
          </Link>
        </li>
      </ul>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Standard plan?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Start free trial
        </Link>
        . Want to shape the product?{" "}
        <Link href={DESIGN_PARTNER_APPLY_PATH} className="font-medium text-primary hover:underline">
          Apply for design partner
        </Link>
        .
      </p>
    </>
  );
}
