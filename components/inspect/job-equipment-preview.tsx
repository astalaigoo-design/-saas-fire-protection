import Link from "next/link";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingAssetLabel } from "@/lib/assets/format";
import { formatDate } from "@/lib/dashboard/dates";
import type { JobEquipmentPreviewRow } from "@/lib/inspect/job-equipment";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 12;

type JobEquipmentPreviewProps = {
  rows: JobEquipmentPreviewRow[];
  buildingId?: string;
  /** Dark field-inspection styling */
  variant?: "field" | "dashboard";
  emptyMessage?: string;
};

export function JobEquipmentPreview({
  rows,
  buildingId,
  variant = "dashboard",
  emptyMessage = "No active equipment on this building.",
}: JobEquipmentPreviewProps) {
  const isField = variant === "field";
  const preview = rows.slice(0, PREVIEW_LIMIT);
  const remaining = rows.length - preview.length;

  if (rows.length === 0) {
    return (
      <p className={cn("text-sm", isField ? "text-slate-500" : "text-muted-foreground")}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {preview.map((row) => (
          <li
            key={row.id}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              isField
                ? "border-slate-700 bg-slate-900/60"
                : "border-border bg-muted/30",
            )}
          >
            <p className={cn("font-medium", isField ? "text-white" : "text-foreground")}>
              {buildingAssetLabel(row)}
            </p>
            <p className={cn("mt-0.5", isField ? "text-slate-400" : "text-muted-foreground")}>
              {row.location}
              {row.tagNumber ? null : ` · ${assetTypeLabel(row.assetType)}`}
            </p>
            {row.nextServiceDue ? (
              <p className={cn("mt-1 text-xs", isField ? "text-slate-500" : "text-muted-foreground")}>
                Due {formatDate(row.nextServiceDue)}
                {row.lastServiceAt ? ` · last ${formatDate(row.lastServiceAt)}` : null}
              </p>
            ) : row.lastServiceAt ? (
              <p className={cn("mt-1 text-xs", isField ? "text-slate-500" : "text-muted-foreground")}>
                Last service {formatDate(row.lastServiceAt)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <p className={cn("text-xs", isField ? "text-slate-500" : "text-muted-foreground")}>
          +{remaining} more on the building register
        </p>
      ) : null}
      {buildingId ? (
        <Link
          href={`/dashboard/buildings/${buildingId}?tab=assets`}
          className={cn(
            "inline-block text-sm font-medium underline-offset-2 hover:underline",
            isField ? "text-amber-400" : "text-primary",
          )}
        >
          View full equipment register →
        </Link>
      ) : null}
    </div>
  );
}
