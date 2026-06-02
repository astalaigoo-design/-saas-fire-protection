import { APP_NAME } from "@/lib/branding";

export const howItWorksSteps = [
  {
    step: "1",
    title: "Set up your company",
    body: "Add customers, buildings, and NFPA inspection types. Invite technicians from Organization settings.",
  },
  {
    step: "2",
    title: "Schedule inspections",
    body: "Monthly, quarterly, or annual jobs with citation-backed checklist items created automatically.",
  },
  {
    step: "3",
    title: "Inspect in the field",
    body: "Technicians complete pass/fail items on mobile — offline when signal drops, photos on deficiencies.",
  },
  {
    step: "4",
    title: "Deliver & quote",
    body: "Compliance PDF emails on submit. Failed items become repair quotes customers can accept online.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">How it works</p>
        <h2
          id="how-it-works-heading"
          className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          From schedule to signed report in one system
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {APP_NAME} connects scheduling, NFPA field inspections, client-ready PDFs, and repair
          quoting — built for fire protection contractors, not generic field service tools.
        </p>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorksSteps.map((item) => (
          <li
            key={item.step}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {item.step}
            </span>
            <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function howItWorksJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How ${APP_NAME} works for fire protection inspections`,
    description:
      "Schedule NFPA inspections, complete mobile checklists, email compliance reports, and send repair quotes from one workflow.",
    step: howItWorksSteps.map((item, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: item.title,
      text: item.body,
    })),
  };
}
