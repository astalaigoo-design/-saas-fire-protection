import {
  COMPLIANCE_PDF_CAPABILITIES,
  COMPLIANCE_PDF_NOT_INCLUDED,
} from "@/lib/reports/scope";
import { cn } from "@/lib/utils";

type CompliancePdfScopeNoticeProps = {
  variant?: "inline" | "full";
  className?: string;
};

export function CompliancePdfScopeNotice({
  variant = "inline",
  className,
}: CompliancePdfScopeNoticeProps) {
  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">Flareflow-native NFPA layouts.</span>{" "}
        Certificate PDFs include AHJ and permit metadata from building profiles. Not
        city-specific fire marshal forms — configure jurisdictions under Organization settings.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="compliance-pdf-scope-heading"
    >
      <div>
        <h2
          id="compliance-pdf-scope-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Compliance PDFs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspection data renders into Flareflow certificate layouts. Jurisdiction records drive
          certificate numbering and optional NFPA form overrides — not a full library of municipal
          AHJ forms.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {COMPLIANCE_PDF_CAPABILITIES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Not included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {COMPLIANCE_PDF_NOT_INCLUDED.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
