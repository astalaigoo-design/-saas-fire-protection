import type { ReactNode } from "react";

type PreviewProps = {
  className?: string;
};

export function MobileInspectPreview({ className = "" }: PreviewProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[220px] overflow-hidden rounded-[2rem] border-4 border-slate-700 bg-slate-950 shadow-2xl shadow-black/40 ${className}`}
      aria-hidden
    >
      <div className="flex items-center justify-center gap-1 bg-slate-900 px-3 py-2">
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="text-[9px] font-medium text-amber-100">Saved locally — will sync</span>
      </div>
      <div className="space-y-3 p-3">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-400">
            Monthly sprinkler
          </p>
          <p className="mt-0.5 text-xs font-semibold text-white">Riverside Medical — Bldg A</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-[9px] text-slate-500">Item 3 of 6</p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-white">
            Sprinkler heads free of obstruction
          </p>
          <p className="mt-2 text-[8px] leading-relaxed text-slate-400">
            NFPA 25 §5.2.1 — clearance below deflectors
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-amber-400">
              Pass
            </div>
            <div className="flex min-h-10 items-center justify-center rounded-xl bg-red-700/90 text-[10px] font-bold text-white">
              Fail
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-emerald-300">Done</p>
        </div>
      </div>
    </div>
  );
}

export function ComplianceReportPreview({ className = "" }: PreviewProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-white shadow-xl ${className}`}
      aria-hidden
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="size-8 rounded-lg bg-amber-500/20" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-900">Compliance Report</p>
            <p className="text-[8px] text-slate-500">Riverside Medical · Mar 2026</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-medium text-slate-700">Monthly fire sprinkler</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
            Pass
          </span>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="font-medium text-red-900">Gauges — dry pipe</span>
            <span className="rounded-full bg-red-200 px-2 py-0.5 font-semibold text-red-800">
              Fail
            </span>
          </div>
          <p className="mt-1 text-[8px] leading-relaxed text-red-800/80">
            NFPA 25 §5.2.4 — gauge reads below operable range
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] text-slate-500">
          <span>Technician signature on file</span>
          <span className="font-medium text-amber-700">PDF ready to email</span>
        </div>
      </div>
    </div>
  );
}

export function CommandCenterPreview({ className = "" }: PreviewProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-xl ${className}`}
      aria-hidden
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold text-foreground">Command center</p>
        <p className="text-[10px] text-muted-foreground">Compliance workload at a glance</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2">
          <p className="text-lg font-bold text-destructive">2</p>
          <p className="text-[9px] text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">4</p>
          <p className="text-[9px] text-muted-foreground">Due soon</p>
        </div>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        <li className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-[10px] font-medium text-foreground">Draft repair quote</p>
            <p className="text-[8px] text-muted-foreground">From failed inspection</p>
          </div>
          <span className="text-[9px] font-semibold text-primary">$1,240</span>
        </li>
        <li className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-[10px] font-medium text-foreground">Report sent</p>
            <p className="text-[8px] text-muted-foreground">Riverside Medical</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-medium text-emerald-600 dark:text-emerald-300">
            Emailed
          </span>
        </li>
      </ul>
    </div>
  );
}

type ProductShowcaseItem = {
  title: string;
  description: string;
  preview: ReactNode;
};

export const productShowcase: ProductShowcaseItem[] = [
  {
    title: "NFPA field inspection",
    description:
      "Technicians swipe through citation-backed checklist items on their phone. Big pass/fail controls, offline sync, and deficiency photos on failed items only.",
    preview: <MobileInspectPreview />,
  },
  {
    title: "Client-ready compliance report",
    description:
      "Submit once — GetFlareflow generates a branded PDF with NFPA references, pass/fail summary, photos, and signature. Email it to the customer automatically.",
    preview: <ComplianceReportPreview className="max-w-[260px]" />,
  },
  {
    title: "Command center for owners",
    description:
      "See overdue buildings, open deficiencies, draft repair quotes from failed items, and reports sent this month — without digging through spreadsheets.",
    preview: <CommandCenterPreview className="max-w-[260px]" />,
  },
];
