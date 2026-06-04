"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CopyReportLinkButton } from "@/components/reports/copy-report-link-button";
import { publicCustomerPortalUrl } from "@/lib/app-url";
import {
  disableCustomerPortal,
  enableCustomerPortal,
} from "@/lib/customers/portal-actions";

type CustomerPortalSectionProps = {
  customerId: string;
  portalToken: string | null;
  portalEnabledAt: string | null;
};

export function CustomerPortalSection({
  customerId,
  portalToken,
  portalEnabledAt,
}: CustomerPortalSectionProps) {
  const [token, setToken] = useState(portalToken);
  const [enabledAt, setEnabledAt] = useState<string | null>(portalEnabledAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const portalUrl = token ? publicCustomerPortalUrl(token) : null;

  return (
    <section
      aria-labelledby="customer-portal-heading"
      className="max-w-2xl rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2
        id="customer-portal-heading"
        className="font-heading text-base font-semibold text-foreground"
      >
        Customer portal
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share a read-only link so your customer can view finalized compliance PDFs by building.
        This is not a staff login — no Clerk account for the customer.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {portalUrl && enabledAt ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <CopyReportLinkButton url={portalUrl} />
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-primary hover:underline"
            >
              {portalUrl}
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Enabled {enabledAt.toLocaleDateString()}. Disable to invalidate the link.
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await disableCustomerPortal(customerId);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setToken(null);
                setEnabledAt(null);
              });
            }}
          >
            Disable portal link
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="mt-4 min-h-10"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await enableCustomerPortal(customerId);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setToken(result.portalToken);
              setEnabledAt(new Date().toISOString());
            });
          }}
        >
          {isPending ? "Enabling…" : "Enable portal link"}
        </Button>
      )}
    </section>
  );
}
