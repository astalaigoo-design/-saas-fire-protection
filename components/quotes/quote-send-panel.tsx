"use client";

import { useFormState, useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { sendDraftQuote, type SendQuoteActionResult } from "@/lib/quotes/actions";
import { cn } from "@/lib/utils";

type QuoteSendPanelProps = {
  quoteId: string;
  customerEmail: string | null;
  totalLabel: string;
};

function SendQuoteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        buttonVariants({ size: "default" }),
        "min-h-10 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60",
      )}
    >
      {pending ? "Sending…" : "Email report & quote"}
    </button>
  );
}

export function QuoteSendPanel({ quoteId, customerEmail, totalLabel }: QuoteSendPanelProps) {
  const [state, formAction] = useFormState(sendDraftQuote, null as SendQuoteActionResult | null);
  const previewUrl = `/api/quotes/${quoteId}/pdf`;

  if (state?.ok) {
    const sentMessage =
      state.channel === "email"
        ? `Inspection report and quote emailed to ${state.sentTo} (PDFs attached, with online links).`
        : state.channel === "sms"
          ? `Quote link texted to ${state.sentTo}.`
          : "Quote marked sent — share the customer link below.";

    return (
      <div
        role="status"
        className="mt-3 space-y-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
      >
        <p>{sentMessage}</p>
        <p>
          Customer link:{" "}
          <a
            href={state.publicUrl}
            data-testid="public-quote-link"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            {state.publicUrl}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Review & send</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sends the compliance inspection report and repair quote in one email ({totalLabel}{" "}
          quote total). Customer accept on the link is approval only — no card charge or invoice.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        >
          Preview quote PDF
        </a>
      </div>

      {customerEmail ? (
        <p className="text-sm text-muted-foreground">
          Sends to <span className="font-medium text-foreground">{customerEmail}</span>
        </p>
      ) : (
        <p role="alert" className="text-sm text-destructive">
          Add a customer email on the customer profile before sending.
        </p>
      )}

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="quoteId" value={quoteId} />
        <SendQuoteButton />
      </form>
    </div>
  );
}
