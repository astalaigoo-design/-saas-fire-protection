import Link from "next/link";
import type { PilotReadinessItem, PilotReadinessStatus } from "@/lib/pilot-readiness/status";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PilotReadinessChecklistProps = {
  status: PilotReadinessStatus;
  id?: string;
  compact?: boolean;
};

function StatusDot({ configured, required }: { configured: boolean; required: boolean }) {
  return (
    <span
      className={cn(
        "mt-1.5 size-2 shrink-0 rounded-full",
        configured
          ? "bg-emerald-500"
          : required
            ? "bg-amber-500"
            : "bg-muted-foreground/40",
      )}
      aria-hidden
    />
  );
}

function ReadinessItemRow({ item, compact }: { item: PilotReadinessItem; compact?: boolean }) {
  return (
    <li className="flex gap-3">
      <StatusDot configured={item.configured} required={item.required} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{item.label}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              item.configured
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                : item.required
                  ? "bg-amber-500/15 text-amber-900 dark:text-amber-100"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {item.configured ? "Ready" : item.required ? "Action needed" : "Optional"}
          </span>
        </div>
        {!compact ? (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        ) : null}
        {item.detail ? (
          <p className="text-xs text-muted-foreground">{item.detail}</p>
        ) : null}
        {item.envVars.length > 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            {item.envVars.join(" · ")}
          </p>
        ) : null}
        {!item.configured ? (
          <Link
            href={item.actionHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-1 inline-flex min-h-9",
            )}
          >
            {item.actionLabel}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function PilotReadinessChecklist({
  status,
  id = "pilot-readiness",
  compact = false,
}: PilotReadinessChecklistProps) {
  const requiredItems = status.items.filter((item) => item.required);
  const optionalItems = status.items.filter((item) => !item.required);

  return (
    <Card
      id={id}
      className={cn(!status.ready && "border-amber-500/30")}
      aria-labelledby={`${id}-heading`}
    >
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle id={`${id}-heading`} className="text-base">
            Pilot readiness
          </CardTitle>
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium",
              status.ready
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
            )}
            role="status"
          >
            {status.ready
              ? "All required items configured"
              : `${status.requiredComplete} of ${status.requiredTotal} required`}
          </span>
        </div>
        {!compact ? (
          <p className="text-sm text-muted-foreground">
            Server environment checks for production pilots — Resend, Supabase photos, cron security,
            and current database schema. Set variables in Vercel Production, then redeploy.
            {status.isProduction
              ? ""
              : " CRON_SECRET is only required on the production deployment."}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Required
          </p>
          <ul className="mt-3 space-y-4">
            {requiredItems.map((item) => (
              <ReadinessItemRow key={item.id} item={item} compact={compact} />
            ))}
          </ul>
        </div>

        {optionalItems.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Optional ({status.optionalComplete} of {status.optionalTotal})
            </p>
            <ul className="mt-3 space-y-4">
              {optionalItems.map((item) => (
                <ReadinessItemRow key={item.id} item={item} compact={compact} />
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
