import Link from "next/link";
import {
  AHJ_INTEGRATION_TRANSPARENCY,
  COMPARE_FAQS,
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  COMPARE_PATH,
  COMPETITIVE_STRENGTHS,
  RATING_LABELS,
  type ComparisonRating,
} from "@/lib/marketing/competitive-comparison";
import {
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
} from "@/lib/marketing/cta-classes";
import { DESIGN_PARTNER_APPLY_PATH } from "@/lib/branding";
import { cn } from "@/lib/utils";

type CompetitiveComparisonSectionProps = {
  id?: string;
  variant?: "compact" | "full";
  className?: string;
};

function RatingBadge({ rating }: { rating: ComparisonRating }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        rating === "strong" && "bg-primary/15 text-primary",
        rating === "yes" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        rating === "partial" && "bg-amber-500/15 text-amber-800 dark:text-amber-400",
        rating === "varies" && "bg-muted text-muted-foreground",
        rating === "no" && "bg-muted text-muted-foreground",
      )}
    >
      {RATING_LABELS[rating]}
    </span>
  );
}

function ComparisonTable() {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 font-medium text-muted-foreground">
                Capability
              </th>
              <th scope="col" className="px-4 py-3 font-heading font-semibold text-foreground">
                {COMPARISON_COLUMNS.flareflow}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                {COMPARISON_COLUMNS.fireSpecialists}
              </th>
              <th scope="col" className="py-3 pl-4 font-medium text-muted-foreground">
                {COMPARISON_COLUMNS.enterprise}
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-border/60 align-top">
                <th scope="row" className="max-w-[12rem] py-4 pr-4 font-medium text-foreground">
                  {row.feature}
                </th>
                <td className="px-4 py-4">
                  <RatingBadge rating={row.flareflow.rating} />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{row.flareflow.note}</p>
                </td>
                <td className="px-4 py-4">
                  <RatingBadge rating={row.fireSpecialists.rating} />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {row.fireSpecialists.note}
                  </p>
                </td>
                <td className="py-4 pl-4">
                  <RatingBadge rating={row.enterprise.rating} />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{row.enterprise.note}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-4 lg:hidden">
        {COMPARISON_ROWS.map((row) => (
          <li
            key={row.feature}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <h3 className="font-heading text-sm font-semibold text-foreground">{row.feature}</h3>
            <dl className="mt-4 space-y-3">
              {(
                [
                  ["flareflow", COMPARISON_COLUMNS.flareflow, row.flareflow],
                  ["fireSpecialists", COMPARISON_COLUMNS.fireSpecialists, row.fireSpecialists],
                  ["enterprise", COMPARISON_COLUMNS.enterprise, row.enterprise],
                ] as const
              ).map(([key, label, cell]) => (
                <div key={key}>
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="mt-1">
                    <RatingBadge rating={cell.rating} />
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{cell.note}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CompetitiveComparisonSection({
  id = "compare",
  variant = "compact",
  className,
}: CompetitiveComparisonSectionProps) {
  const isFull = variant === "full";

  return (
    <section
      id={id}
      aria-labelledby="compare-heading"
      className={className ?? "border-y border-border/60 bg-card/40 py-14 sm:py-16"}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Compare</p>
          <h2
            id="compare-heading"
            className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {isFull
              ? "GetFlareflow vs. fire inspection software"
              : "Why contractors choose GetFlareflow"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {isFull
              ? "An honest look at how GetFlareflow compares to fire-specialist tools and enterprise field-service platforms — including where AHJ portal integrations differ today."
              : "Fire-specialist tools and enterprise FSM platforms each solve part of the problem. Here is where GetFlareflow focuses — and what we are transparent about."}
          </p>
        </div>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {COMPETITIVE_STRENGTHS.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>

        <aside
          aria-labelledby="ahj-transparency-heading"
          className="mt-10 rounded-2xl border border-primary/30 bg-card p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Integration transparency
          </p>
          <h3
            id="ahj-transparency-heading"
            className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            {AHJ_INTEGRATION_TRANSPARENCY.headline}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {AHJ_INTEGRATION_TRANSPARENCY.body}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {AHJ_INTEGRATION_TRANSPARENCY.roadmap}{" "}
            <Link href={DESIGN_PARTNER_APPLY_PATH} className="font-medium text-primary hover:underline">
              Apply for design partner
            </Link>{" "}
            to help prioritize your AHJs.
          </p>
        </aside>

        {isFull ? (
          <div className="mt-12">
            <h3 className="font-heading text-xl font-semibold tracking-tight">Feature comparison</h3>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              Competitor capabilities vary by product, contract, and region — verify with each vendor
              before you buy. This table reflects typical positioning, not a guarantee of any
              specific competitor feature set.
            </p>
            <div className="mt-6">
              <ComparisonTable />
            </div>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm">
            <Link href={COMPARE_PATH} className="font-medium text-primary hover:underline">
              See full comparison table and FAQ →
            </Link>
          </p>
        )}

        {isFull ? (
          <section aria-labelledby="compare-faq-heading" className="mt-14 space-y-6">
            <h3 id="compare-faq-heading" className="font-heading text-xl font-semibold tracking-tight">
              Comparison FAQ
            </h3>
            <dl className="space-y-5">
              {COMPARE_FAQS.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <dt className="font-heading text-base font-semibold text-foreground">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {isFull ? (
          <div className="mt-12 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link href="/sign-up" className={marketingPrimaryCtaClass}>
              Start free trial
            </Link>
            <Link href={DESIGN_PARTNER_APPLY_PATH} className={marketingSecondaryCtaClass}>
              Apply for design partner
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
