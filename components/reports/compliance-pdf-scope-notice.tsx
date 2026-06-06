import { OperatingMarket } from "@prisma/client";
import {
  getCompliancePdfCapabilities,
  getCompliancePdfInlineNotice,
  getCompliancePdfScopeDescription,
  COMPLIANCE_PDF_NOT_INCLUDED,
} from "@/lib/reports/scope";
import { cn } from "@/lib/utils";

type CompliancePdfScopeNoticeProps = {
  operatingMarket?: OperatingMarket;
  variant?: "inline" | "full";
  className?: string;
};

export function CompliancePdfScopeNotice({
  operatingMarket = OperatingMarket.US,
  variant = "inline",
  className,
}: CompliancePdfScopeNoticeProps) {
  const inline = getCompliancePdfInlineNotice(operatingMarket);
  const capabilities = getCompliancePdfCapabilities(operatingMarket);

  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">{inline.title}</span> {inline.body}
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
          {getCompliancePdfScopeDescription(operatingMarket)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {capabilities.map((line) => (
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
