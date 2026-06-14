import Link from "next/link";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { APP_NAME, DESIGN_PARTNER_APPLY_PATH, PILOT_SUPPORT_EMAIL } from "@/lib/branding";
import {
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";

type AboutSectionProps = {
  id?: string;
  className?: string;
};

export function AboutSection({ id, className }: AboutSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby="about-heading"
      className={className ?? "mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16"}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Why we built this</p>
        <h2
          id="about-heading"
          className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Compliance software you can hold accountable
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Fire protection carries real liability, so generic field-service tools aren&apos;t good
          enough. {APP_NAME} exists because inspection software should speak NFPA natively — and
          because the contractors using it should be able to reach the people building it.
        </p>
      </div>

      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        <li className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Built around the standard
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Every checklist item cites the exact NFPA standard, edition, and section, and reports
            are formatted for the documentation AHJs expect. Compliance isn&apos;t a feature we
            added — it&apos;s the reason the product exists.
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Shaped by contractors in the field
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Our design partner program puts the product in the hands of working fire protection
            contractors who run real inspections and steer the roadmap. What you see was built from
            their trucks, ladders, and risers — not from guesses.
          </p>
        </li>
        <li className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Talk to the people building it
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            No ticket queues or chatbots. Email{" "}
            <a
              href={`mailto:${PILOT_SUPPORT_EMAIL}`}
              className="font-medium text-primary hover:underline"
            >
              {PILOT_SUPPORT_EMAIL}
            </a>{" "}
            and the team building {APP_NAME} answers — questions, bug reports, and feature requests
            included.
          </p>
        </li>
      </ul>

      <div className="mt-8 rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Early access, honestly
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          We&apos;re early, and we&apos;d rather show you the product than borrowed logos. Run a
          real inspection on the {TRIAL_DAYS}-day free trial and judge the reports yourself — or
          write to us and we&apos;ll answer personally. If you want to shape the product,{" "}
          <Link href={DESIGN_PARTNER_APPLY_PATH} className="font-medium text-primary hover:underline">
            apply for the design partner program
          </Link>
          .
        </p>
        <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link href="/sign-up" className={marketingPrimaryCtaClass}>
            Start free trial
          </Link>
          <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
            Apply for design partner
          </Link>
        </div>
      </div>
    </section>
  );
}
