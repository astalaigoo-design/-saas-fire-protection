import {
  AHJ_FILING_CAPABILITIES,
  AHJ_FILING_NOT_INCLUDED,
  AHJ_FILING_WEBHOOK_EVENT,
} from "@/lib/integrations/ahj-filing-scope";
import { cn } from "@/lib/utils";

type AhjFilingScopeNoticeProps = {
  variant?: "inline" | "full";
  className?: string;
};

export function AhjFilingScopeNotice({
  variant = "inline",
  className,
}: AhjFilingScopeNoticeProps) {
  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">AHJ e-filing is partner-specific.</span>{" "}
        Flareflow emits <span className="font-mono text-xs">{AHJ_FILING_WEBHOOK_EVENT}</span>{" "}
        webhooks with jurisdiction and PDF URLs — your integration partner maps each AHJ to its
        municipal portal. No built-in fire marshal submission in core Flareflow.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="ahj-filing-scope-heading"
    >
      <div>
        <h2
          id="ahj-filing-scope-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          AHJ electronic filing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Municipal fire marshal portals differ by city and county. Flareflow supplies certificate
          data and webhooks; certified partners build jurisdiction-specific filing adapters.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {AHJ_FILING_CAPABILITIES.map((line) => (
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
          {AHJ_FILING_NOT_INCLUDED.map((line) => (
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
