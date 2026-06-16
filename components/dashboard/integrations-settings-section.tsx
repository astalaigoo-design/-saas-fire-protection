"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAppOrigin } from "@/lib/app-url";
import { APP_NAME } from "@/lib/branding";
import { AHJ_FILING_WEBHOOK_EVENT } from "@/lib/integrations/ahj-filing-scope";
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

const API_ENDPOINTS = [
  { methods: ["GET", "POST"] as const, path: "/inspections", description: "List or schedule a visit" },
  { methods: ["GET", "POST"] as const, path: "/customers", description: "List or create (+ optional building)" },
  { methods: ["GET"] as const, path: "/buildings", description: "List sites" },
  { methods: ["GET"] as const, path: "/deficiencies", description: "Open deficiencies" },
] as const;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? pendingLabel : label}
    </Button>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wide">
      {method}
    </Badge>
  );
}

function SecretRevealBanner({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 font-mono text-xs break-all">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function CollapsibleHelp({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border bg-muted/20">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span
            className="text-xs font-normal text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="space-y-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function IntegrationsSettingsSection({ data }: IntegrationsSettingsSectionProps) {
  const origin = getAppOrigin();
  const apiBaseUrl = `${origin}/api/v1`;
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
      className="max-w-2xl space-y-6"
      aria-labelledby="integrations-heading"
    >
      <div className="space-y-3">
        <div>
          <h2
            id="integrations-heading"
            className="font-heading text-lg font-semibold text-foreground"
          >
            Integrations
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Connect your CMMS or accounting stack with a REST API and outbound webhooks. All access
            is scoped to your company.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Integration notes">
          <li>
            <Badge variant="secondary">Secrets shown once</Badge>
          </li>
          <li>
            <Badge variant="secondary">Company-scoped</Badge>
          </li>
          <li>
            <Badge variant="outline">
              Quotes sync status only — see{" "}
              <a href="#repair-quotes" className="underline-offset-2 hover:underline">
                Repair quotes
              </a>
            </Badge>
          </li>
        </ul>
      </div>

      {actionError ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>REST API</CardTitle>
          <CardDescription>
            Pull inspections, customers, buildings, and deficiencies — or schedule work from your
            external system.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Base URL
            </p>
            <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 font-mono text-xs break-all text-foreground">
              {apiBaseUrl}
            </p>
          </div>

          <CollapsibleHelp title="Authentication &amp; query options">
            <p>
              Send{" "}
              <span className="font-mono text-xs text-foreground">Authorization: Bearer ff_live_…</span>{" "}
              or <span className="font-mono text-xs text-foreground">X-Api-Key</span>.
            </p>
            <p>
              GET requests support{" "}
              <span className="font-mono text-xs text-foreground">?limit=50</span> and{" "}
              <span className="font-mono text-xs text-foreground">?since=2026-01-01T00:00:00.000Z</span>.
            </p>
            <p>
              POST requests accept optional{" "}
              <span className="font-mono text-xs text-foreground">X-Idempotency-Key</span> for safe
              retries.
            </p>
          </CollapsibleHelp>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[7.5rem]">Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="hidden sm:table-cell">Use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {API_ENDPOINTS.map((endpoint) => (
                  <TableRow key={endpoint.path}>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.methods.map((method) => (
                          <MethodBadge key={method} method={method} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{endpoint.path}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {endpoint.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">API keys</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a labeled key for each external system (NetSuite, MaintainX, custom scripts).
              </p>
            </div>

            {apiKeysList(data, startTransition, setActionError, pending)}

            {apiKeyState?.ok === true && apiKeyState.rawKey ? (
              <SecretRevealBanner
                title="Copy your API key now"
                value={apiKeyState.rawKey}
                hint="This value is not shown again. Store it in your CMMS or accounting tool."
              />
            ) : null}

            <form
              action={createKeyAction}
              className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/10 p-4 sm:flex-row sm:items-end"
            >
              {apiKeyState?.ok === false ? (
                <p role="alert" className="text-sm text-destructive sm:col-span-2">
                  {apiKeyState.error}
                </p>
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Outbound webhooks</CardTitle>
          <CardDescription>
            {APP_NAME} POSTs signed JSON to your HTTPS endpoint when events happen in your workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <CollapsibleHelp title="How webhook signing works">
            <p>
              Each delivery includes header{" "}
              <span className="font-mono text-xs text-foreground">X-Flareflow-Signature: sha256=…</span>{" "}
              — HMAC-SHA256 of the raw body using your endpoint secret.
            </p>
            <p>
              Subscribe to{" "}
              <span className="font-mono text-xs text-foreground">{AHJ_FILING_WEBHOOK_EVENT}</span>{" "}
              for certificate numbers, AHJ / permit fields, and public PDF URLs when a partner
              builds municipal e-filing adapters.
            </p>
          </CollapsibleHelp>

          {webhooksList(data, startTransition, setActionError, pending)}

          {webhookState?.ok === true && webhookState.webhookSecret ? (
            <SecretRevealBanner
              title="Copy your webhook signing secret"
              value={webhookState.webhookSecret}
              hint="Used to verify payloads. This secret is not shown again."
            />
          ) : null}

          <form
            action={createWebhookAction}
            className="space-y-4 rounded-lg border border-dashed border-border bg-muted/10 p-4"
          >
            {webhookState?.ok === false ? (
              <p role="alert" className="text-sm text-destructive">
                {webhookState.error}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webhook-label">Label</Label>
                <Input id="webhook-label" name="label" placeholder="e.g. MaintainX" className="min-h-11" />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Events to send</legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {ALL_WEBHOOK_EVENTS.map((event) => (
                  <li key={event}>
                    <label
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors",
                        "has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="events"
                        value={event}
                        defaultChecked={event === "inspection_completed"}
                        className="size-4 shrink-0 rounded border-border"
                      />
                      <span>{WEBHOOK_EVENT_LABELS[event]}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <SubmitButton label="Add webhook" pendingLabel="Adding…" />
          </form>
        </CardContent>
      </Card>

      <CollapsibleHelp title="AHJ e-filing (partner-specific)">
        <p>
          Municipal fire marshal portals differ by city and county. {APP_NAME} emits{" "}
          <span className="font-mono text-xs text-foreground">{AHJ_FILING_WEBHOOK_EVENT}</span>{" "}
          webhooks with jurisdiction and PDF URLs — your integration partner maps each AHJ to its
          portal.
        </p>
        <p>There is no built-in fire marshal submission in core {APP_NAME}.</p>
      </CollapsibleHelp>
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
    return (
      <EmptyState
        title="No API keys yet"
        description="Create a key to connect NetSuite, MaintainX, or your own integration scripts."
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border text-sm">
      {data.apiKeys.map((key) => (
        <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{key.label}</p>
              <Badge variant={key.active ? "secondary" : "outline"}>
                {key.active ? "Active" : "Revoked"}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
            {key.lastUsedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last used {new Date(key.lastUsedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          {key.active ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className="min-h-10"
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
    return (
      <EmptyState
        title="No webhooks yet"
        description="Add an HTTPS endpoint to receive inspection, report, quote, and deficiency events."
        className="py-8"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.webhooks.map((hook) => (
        <li
          key={hook.id}
          className="space-y-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{hook.label}</p>
                <Badge
                  variant={hook.active ? "secondary" : "outline"}
                  className={cn(
                    hook.active &&
                      "border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
                  )}
                >
                  {hook.active ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{hook.url}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hook.events.map((event) => (
                  <Badge key={event} variant="outline" className="font-normal">
                    {WEBHOOK_EVENT_LABELS[event as keyof typeof WEBHOOK_EVENT_LABELS] ?? event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || !hook.active}
              className="min-h-10"
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
              className="min-h-10"
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
              className="min-h-10 text-destructive hover:text-destructive"
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
