import {
  REPAIR_QUOTE_ACCEPT_DISCLAIMER,
  REPAIR_QUOTE_CAPABILITIES,
  REPAIR_QUOTE_NOT_INCLUDED,
} from "@/lib/quotes/scope";
import { cn } from "@/lib/utils";

type RepairQuotesScopeNoticeProps = {
  variant?: "inline" | "full";
  className?: string;
};

export function RepairQuotesScopeNotice({
  variant = "inline",
  className,
}: RepairQuotesScopeNoticeProps) {
  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">Internal repair quotes.</span>{" "}
        Email PDFs and collect accept/decline on /q/… links. After acceptance, create a repair
        invoice on the Invoices page — separate from Flareflow subscription (Paddle) and
        QuickBooks.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      aria-labelledby="repair-quotes-scope-heading"
    >
      <div>
        <h2
          id="repair-quotes-scope-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Repair quotes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Failed inspections create draft repair estimates inside Flareflow. You email them to
          customers and track accept/decline — separate from your Flareflow subscription (Paddle)
          and separate from customer invoicing.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Included
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {REPAIR_QUOTE_CAPABILITIES.map((line) => (
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
          {REPAIR_QUOTE_NOT_INCLUDED.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">{REPAIR_QUOTE_ACCEPT_DISCLAIMER}</p>
    </section>
  );
}
