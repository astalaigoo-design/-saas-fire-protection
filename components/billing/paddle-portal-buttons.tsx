"use client";

import { useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  openPaddlePortalAction,
  type OpenPaddlePortalResult,
} from "@/lib/billing/portal-actions";
import type { PaddlePortalIntent } from "@/lib/billing/paddle-api";
import { cn } from "@/lib/utils";

type PaddlePortalButtonsProps = {
  canManage: boolean;
  hasLinkedSubscription: boolean;
  portalApiConfigured: boolean;
  fallbackPortalUrl: string | null;
  showCancelAndUpdate: boolean;
};

export function PaddlePortalButtons({
  canManage,
  hasLinkedSubscription,
  portalApiConfigured,
  fallbackPortalUrl,
  showCancelAndUpdate,
}: PaddlePortalButtonsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        Only the company owner can manage billing and subscriptions.
      </p>
    );
  }

  async function openPortal(intent: PaddlePortalIntent) {
    setError(null);
    startTransition(async () => {
      const result: OpenPaddlePortalResult = await openPaddlePortalAction(intent);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  const canDeepLink = portalApiConfigured && hasLinkedSubscription;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending || (!canDeepLink && !fallbackPortalUrl)}
          onClick={() => openPortal("overview")}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
        >
          {pending ? "Opening…" : "Open customer portal"}
        </button>
        {showCancelAndUpdate && canDeepLink ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => openPortal("update_payment")}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              Update payment method
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => openPortal("cancel")}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              Cancel subscription
            </button>
          </>
        ) : null}
      </div>
      {!portalApiConfigured && fallbackPortalUrl ? (
        <p className="text-xs text-muted-foreground">
          Set <code className="text-foreground">PADDLE_API_KEY</code> with{" "}
          <code className="text-foreground">customer_portal_session.write</code> to enable
          one-click update card and cancel links.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
