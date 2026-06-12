import { TRIAL_DAYS } from "@/lib/billing/constants";
import { PILOT_PRICING, PILOT_SUPPORT_EMAIL } from "@/lib/branding";

/** Plan cards + support contact, shared by the homepage pricing section and /pricing. */
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
            {PILOT_PRICING.designPartner.limitNote}
          </p>
        </li>
      </ul>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Questions or to join the pilot?{" "}
        <a
          href={`mailto:${PILOT_SUPPORT_EMAIL}?subject=GetFlareflow%20pilot%20pricing`}
          className="font-medium text-primary hover:underline"
        >
          {PILOT_SUPPORT_EMAIL}
        </a>
      </p>
    </>
  );
}
