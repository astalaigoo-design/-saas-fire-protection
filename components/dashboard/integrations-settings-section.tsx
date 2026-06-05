"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AhjFilingScopeNotice } from "@/components/integrations/ahj-filing-scope-notice";
import { getAppOrigin } from "@/lib/app-url";
import {
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
} from "@/lib/integrations/constants";
import type { IntegrationsSettingsData } from "@/lib/integrations/queries";
import {
  createCompanyApiKey,
  createCompanyWebhook,
  deleteCompanyWebhook,
  revokeCompanyApiKey,
  sendTestWebhook,
  toggleCompanyWebhook,
  type IntegrationActionResult,
} from "@/lib/integrations/actions";
import { cn } from "@/lib/utils";

type IntegrationsSettingsSectionProps = {
  data: IntegrationsSettingsData;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function IntegrationsSettingsSection({ data }: IntegrationsSettingsSectionProps) {
  const origin = getAppOrigin();
  const [apiKeyState, createKeyAction] = useFormState<
    IntegrationActionResult | undefined,
    FormData
  >(createCompanyApiKey, undefined);
  const [webhookState, createWebhookAction] = useFormState<
    IntegrationActionResult | undefined,
    FormData
  >(createCompanyWebhook, undefined);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <section
      id="integrations"
      className="max-w-2xl space-y-8 rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="integrations-heading"
    >
      <div>
        <h2
          id="integrations-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          CMMS &amp; accounting integrations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect external systems with a REST API and signed outbound webhooks. API keys and
          webhook secrets are shown once when created — store them in your CMMS or accounting tool.
          Requests are scoped to your company only.{" "}
          <span className="text-foreground">
            Repair quote webhooks sync status only — not QuickBooks invoices or Stripe payments.
          </span>{" "}
          See{" "}
          <a href="#repair-quotes" className="font-medium text-primary underline-offset-2 hover:underline">
            Repair quotes
          </a>{" "}
          below.
        </p>
      </div>

      <AhjFilingScopeNotice variant="inline" />

      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">REST API</h3>
        <p className="text-sm text-muted-foreground">
          Base URL: <span className="font-mono text-xs">{origin}/api/v1</span>. Send{" "}
          <span className="font-mono text-xs">Authorization: Bearer ff_live_…</span> or{" "}
          <span className="font-mono text-xs">X-Api-Key</span>. Optional query on GET:{" "}
          <span className="font-mono text-xs">?limit=50&amp;since=2026-01-01T00:00:00.000Z</span>.
          POST requests accept optional{" "}
          <span className="font-mono text-xs">X-Idempotency-Key</span> for safe retries.
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>
            <span className="font-mono text-xs">GET /inspections</span> ·{" "}
            <span className="font-mono text-xs">POST /inspections</span> schedule a visit
          </li>
          <li>
            <span className="font-mono text-xs">GET /customers</span> ·{" "}
            <span className="font-mono text-xs">POST /customers</span> create account (+ optional
            building)
          </li>
          <li>
            <span className="font-mono text-xs">GET /buildings</span>
          </li>
          <li>
            <span className="font-mono text-xs">GET /deficiencies</span>
          </li>
        </ul>

        {apiKeysList(data, startTransition, setActionError, pending)}

        {apiKeyState?.ok === true && apiKeyState.rawKey ? (
          <div
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
            role="status"
          >
            <p className="font-medium text-foreground">Copy your API key now</p>
            <p className="mt-1 font-mono text-xs break-all">{apiKeyState.rawKey}</p>
            <p className="mt-2 text-muted-foreground">This value is not shown again.</p>
          </div>
        ) : null}

        <form action={createKeyAction} className="space-y-3 rounded-lg border border-border p-4">
          {apiKeyState?.ok === false ? (
            <p role="alert" className="text-sm text-destructive">
              {apiKeyState.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="api-key-label">New API key label</Label>
            <Input
              id="api-key-label"
              name="label"
              placeholder="e.g. NetSuite sync"
              className="min-h-11"
            />
          </div>
          <SubmitButton label="Create API key" pendingLabel="Creating…" />
        </form>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Outbound webhooks</h3>
        <p className="text-sm text-muted-foreground">
          Flareflow POSTs JSON to your HTTPS endpoint with header{" "}
          <span className="font-mono text-xs">X-Flareflow-Signature: sha256=…</span> (HMAC-SHA256 of
          the raw body using your endpoint secret). Subscribe to{" "}
          <span className="font-mono text-xs">report.finalized</span> for certificate number, AHJ /
          permit fields, and public PDF URLs when building partner e-filing adapters.
        </p>

        {webhooksList(data, startTransition, setActionError, pending)}

        {webhookState?.ok === true && webhookState.webhookSecret ? (
          <div
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
            role="status"
          >
            <p className="font-medium text-foreground">Copy your webhook signing secret</p>
            <p className="mt-1 font-mono text-xs break-all">{webhookState.webhookSecret}</p>
            <p className="mt-2 text-muted-foreground">Used to verify payloads; not shown again.</p>
          </div>
        ) : null}

        <form action={createWebhookAction} className="space-y-4 rounded-lg border border-border p-4">
          {webhookState?.ok === false ? (
            <p role="alert" className="text-sm text-destructive">
              {webhookState.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="webhook-label">Label</Label>
            <Input id="webhook-label" name="label" placeholder="e.g. MaintainX" className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL (HTTPS)</Label>
            <Input
              id="webhook-url"
              name="url"
              type="url"
              required
              placeholder="https://example.com/webhooks/flareflow"
              className="min-h-11"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Events</legend>
            <ul className="space-y-2">
              {ALL_WEBHOOK_EVENTS.map((event) => (
                <li key={event}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="events"
                      value={event}
                      defaultChecked={event === "inspection_completed"}
                      className="size-4 rounded border-border"
                    />
                    {WEBHOOK_EVENT_LABELS[event]}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <SubmitButton label="Add webhook" pendingLabel="Adding…" />
        </form>
      </div>
    </section>
  );
}

function apiKeysList(
  data: IntegrationsSettingsData,
  startTransition: ReturnType<typeof useTransition>[1],
  setActionError: (msg: string | null) => void,
  pending: boolean,
) {
  if (data.apiKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No API keys yet.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {data.apiKeys.map((key) => (
        <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">
              {key.label}{" "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {key.keyPrefix}…
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {key.active ? "Active" : "Revoked"}
              {key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}` : ""}
            </p>
          </div>
          {key.active ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setActionError(null);
                startTransition(async () => {
                  const result = await revokeCompanyApiKey(key.id);
                  if (!result.ok) setActionError(result.error);
                });
              }}
            >
              Revoke
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function webhooksList(
  data: IntegrationsSettingsData,
  startTransition: ReturnType<typeof useTransition>[1],
  setActionError: (msg: string | null) => void,
  pending: boolean,
) {
  if (data.webhooks.length === 0) {
    return <p className="text-sm text-muted-foreground">No webhooks yet.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {data.webhooks.map((hook) => (
        <li key={hook.id} className="space-y-2 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{hook.label}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{hook.url}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hook.events.map((e) => WEBHOOK_EVENT_LABELS[e as keyof typeof WEBHOOK_EVENT_LABELS] ?? e).join(" · ")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                hook.active
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {hook.active ? "On" : "Paused"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || !hook.active}
              onClick={() => {
                setActionError(null);
                startTransition(async () => {
                  const result = await sendTestWebhook(hook.id);
                  if (!result.ok) setActionError(result.error);
                });
              }}
            >
              Send test
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setActionError(null);
                startTransition(async () => {
                  const result = await toggleCompanyWebhook(hook.id, !hook.active);
                  if (!result.ok) setActionError(result.error);
                });
              }}
            >
              {hook.active ? "Pause" : "Resume"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-destructive"
              onClick={() => {
                if (!window.confirm("Delete this webhook endpoint?")) return;
                setActionError(null);
                startTransition(async () => {
                  const result = await deleteCompanyWebhook(hook.id);
                  if (!result.ok) setActionError(result.error);
                });
              }}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
