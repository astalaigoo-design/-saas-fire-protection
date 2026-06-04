"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuoteStatus } from "@prisma/client";
import { REPAIR_QUOTE_ACCEPT_DISCLAIMER } from "@/lib/quotes/scope";
import { cn } from "@/lib/utils";

type PublicQuoteResponsePanelProps = {
  shareToken: string;
  status: QuoteStatus;
};

type PanelState =
  | { phase: "idle" }
  | { phase: "changes" }
  | { phase: "submitting"; action: string }
  | { phase: "done"; message: string; status: QuoteStatus }
  | { phase: "error"; message: string };

export function PublicQuoteResponsePanel({
  shareToken,
  status: initialStatus,
}: PublicQuoteResponsePanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [state, setState] = useState<PanelState>({ phase: "idle" });
  const [changeMessage, setChangeMessage] = useState("");
  const isSubmitting = state.phase === "submitting";

  if (state.phase === "done") {
    return (
      <ResponseBanner
        tone={state.status === QuoteStatus.declined ? "muted" : "success"}
        message={state.message}
      />
    );
  }

  if (status === QuoteStatus.accepted) {
    return (
      <ResponseBanner
        tone="success"
        message="You accepted this quote. The contractor has been notified."
      />
    );
  }

  if (status === QuoteStatus.declined) {
    return (
      <ResponseBanner
        tone="muted"
        message="You declined this quote. The contractor has been notified."
      />
    );
  }

  if (status !== QuoteStatus.sent) {
    return null;
  }

  async function submit(action: "accept" | "decline" | "request_changes") {
    if (action === "request_changes" && changeMessage.trim().length < 10) {
      setState({
        phase: "error",
        message: "Please describe the changes you need (at least 10 characters).",
      });
      return;
    }

    if (action !== "request_changes") {
      const confirmed = window.confirm(
        action === "accept"
          ? "Accept this quote? The contractor will be notified. This does not pay or charge anything."
          : "Decline this quote? The contractor will be notified.",
      );
      if (!confirmed) return;
    }

    setState({ phase: "submitting", action });

    try {
      const payload =
        action === "request_changes"
          ? { action, message: changeMessage.trim() }
          : { action };

      const response = await fetch(`/api/public/quotes/${shareToken}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        status?: QuoteStatus;
      };

      if (!data.ok) {
        setState({
          phase: "error",
          message: data.error ?? "Could not save your response. Please try again.",
        });
        return;
      }

      if (data.status) setStatus(data.status);
      setState({
        phase: "done",
        message: data.message ?? "Thank you — your response has been recorded.",
        status: data.status ?? status,
      });
      router.refresh();
    } catch {
      setState({
        phase: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">
      <p className="text-center text-sm font-medium text-slate-200">Your response</p>

      {state.phase === "error" ? (
        <p className="text-center text-sm text-red-300" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.phase === "changes" ? (
        <div className="space-y-3">
          <label className="block text-xs text-slate-400" htmlFor="quote-changes">
            What would you like changed?
          </label>
          <textarea
            id="quote-changes"
            rows={4}
            value={changeMessage}
            onChange={(event) => setChangeMessage(event.target.value)}
            placeholder="Describe line items, pricing, or scope adjustments…"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            maxLength={2000}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submit("request_changes")}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-amber-500 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60",
              )}
            >
              {isSubmitting ? "Sending…" : "Send change request"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setState({ phase: "idle" })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submit("accept")}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {isSubmitting && state.phase === "submitting" && state.action === "accept"
              ? "Saving…"
              : "Accept quote"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setState({ phase: "changes" })}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
          >
            Request changes
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submit("decline")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting && state.phase === "submitting" && state.action === "decline"
              ? "Saving…"
              : "Decline quote"}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">{REPAIR_QUOTE_ACCEPT_DISCLAIMER}</p>
    </div>
  );
}

function ResponseBanner({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "muted";
}) {
  return (
    <div
      className={cn(
        "mt-5 rounded-xl border px-4 py-3 text-sm",
        tone === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-slate-700 bg-slate-800/80 text-slate-300",
      )}
    >
      {message}
    </div>
  );
}
