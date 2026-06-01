"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  auditActionLabel,
  AUDIT_ACTION_FILTER_OPTIONS,
  AUDIT_ENTITY_FILTER_OPTIONS,
  auditEntityTypeLabel,
} from "@/lib/audit/labels";
import {
  auditEventHref,
  auditEventLinkLabel,
  formatAuditEventSummary,
  type AuditEventForDisplay,
} from "@/lib/audit/format-event";
import { formatDateTime } from "@/lib/dashboard/dates";
import { cn } from "@/lib/utils";

type AuditLogFeedProps = {
  initialEvents: AuditEventForDisplay[];
  initialNextCursor: string | null;
  initialAction: string;
  initialEntityType: string;
};

type AuditApiEvent = Omit<AuditEventForDisplay, "createdAt"> & { createdAt: string };

function parseApiEvents(events: AuditApiEvent[]): AuditEventForDisplay[] {
  return events.map((event) => ({
    ...event,
    createdAt: new Date(event.createdAt),
  }));
}

const selectClassName =
  "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto sm:min-w-[12rem]";

function actorLabel(event: AuditEventForDisplay): string {
  if (event.actorName?.trim()) return event.actorName.trim();
  if (event.actorEmail?.trim()) return event.actorEmail.trim();
  return "System";
}

export function AuditLogFeed({
  initialEvents,
  initialNextCursor,
  initialAction,
  initialEntityType,
}: AuditLogFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(initialEvents);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const action = searchParams.get("action") ?? initialAction;
  const entity = searchParams.get("entity") ?? initialEntityType;

  const applyFilters = useCallback(
    (nextAction: string, nextEntity: string) => {
      const params = new URLSearchParams();
      if (nextAction) params.set("action", nextAction);
      if (nextEntity) params.set("entity", nextEntity);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/dashboard/operations?${query}` : "/dashboard/operations");
      });
    },
    [router],
  );

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (entity) params.set("entity", entity);
      params.set("cursor", nextCursor);
      const response = await fetch(`/api/audit?${params.toString()}`);
      const body = (await response.json()) as {
        ok: boolean;
        events?: AuditApiEvent[];
        nextCursor?: string | null;
        error?: string;
      };
      const rows = body.events;
      if (!response.ok || !body.ok || !rows) {
        throw new Error(body.error ?? "Could not load more events.");
      }
      setEvents((current) => [...current, ...parseApiEvents(rows)]);
      setNextCursor(body.nextCursor ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load more events.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="audit-log-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="audit-log-heading" className="font-heading text-lg font-semibold text-foreground">
            Audit log
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filterable history of inspections, quotes, reminders, and setup changes for your
            organization.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="audit-filter-action">
            Filter by action
          </label>
          <select
            id="audit-filter-action"
            value={action}
            disabled={isPending}
            onChange={(event) => applyFilters(event.target.value, entity)}
            className={selectClassName}
          >
            {AUDIT_ACTION_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all-actions"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="audit-filter-entity">
            Filter by entity type
          </label>
          <select
            id="audit-filter-entity"
            value={entity}
            disabled={isPending}
            onChange={(event) => applyFilters(action, event.target.value)}
            className={selectClassName}
          >
            {AUDIT_ENTITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all-entities"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Updating filters…
        </p>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          title="No audit events"
          description={
            action || entity
              ? "Nothing matches these filters yet. Try clearing filters or complete an inspection to generate events."
              : "Actions such as submitted inspections, sent quotes, and due reminders appear here."
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {events.map((event) => {
            const href = auditEventHref(event);
            const summary = formatAuditEventSummary(event);
            return (
              <li key={event.id} className="px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">
                      {auditActionLabel(event.action)}
                    </p>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {actorLabel(event)}
                      {" · "}
                      {auditEntityTypeLabel(event.entityType)}
                      {" · "}
                      <time dateTime={event.createdAt.toISOString()}>
                        {formatDateTime(event.createdAt)}
                      </time>
                    </p>
                  </div>
                  {href ? (
                    <Link
                      href={href}
                      className={cn(
                        "shrink-0 text-sm font-medium text-primary hover:underline",
                      )}
                    >
                      {auditEventLinkLabel(event)}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {nextCursor ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-10"
          disabled={loadingMore || isPending}
          onClick={() => void loadMore()}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </section>
  );
}
