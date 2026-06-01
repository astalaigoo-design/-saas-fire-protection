"use client";

import { InspectionItemResult } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";
import type { ChecklistItemState } from "@/components/inspect/checklist-item-card";
import {
  applySectionNaToItems,
  getPendingItemIdsInSection,
  groupChecklistItemsBySection,
  type ChecklistSectionKey,
} from "@/lib/inspect/checklist-sections";
import { enqueueOfflineMutation } from "@/lib/offline/indexeddb";
import { apiBulkMarkSectionNa } from "@/lib/offline/inspect-api";
import { cn } from "@/lib/utils";

type ChecklistSectionBulkNaProps = {
  inspectionId: string;
  items: ChecklistItemState[];
  locked: boolean;
  onItemsChange: (items: ChecklistItemState[]) => void;
};

export function ChecklistSectionBulkNa({
  inspectionId,
  items,
  locked,
  onItemsChange,
}: ChecklistSectionBulkNaProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sections = useMemo(() => groupChecklistItemsBySection(items), [items]);
  const sectionsWithPending = sections.filter((section) => section.pendingCount > 0);

  if (sections.length < 2 || sectionsWithPending.length === 0) {
    return null;
  }

  const markSectionNa = (sectionKey: ChecklistSectionKey) => {
    if (locked || pending) return;
    setError(null);

    const pendingIds = getPendingItemIdsInSection(items, sectionKey);
    if (pendingIds.length === 0) return;

    const nextItems = applySectionNaToItems(items, sectionKey);

    startTransition(async () => {
      onItemsChange(nextItems);

      const enqueueOffline = async () => {
        for (const itemId of pendingIds) {
          await enqueueOfflineMutation({
            inspectionId,
            type: "checklist.update",
            payload: {
              itemId,
              result: InspectionItemResult.na,
            },
          });
        }
      };

      if (!navigator.onLine) {
        await enqueueOffline();
        return;
      }

      try {
        const response = await apiBulkMarkSectionNa(inspectionId, sectionKey);
        if (!response.ok) {
          setError(response.error);
          onItemsChange(items);
          return;
        }
      } catch {
        await enqueueOffline();
      }
    });
  };

  return (
    <div className="space-y-2 px-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sections — mark all N/A
        </p>
        <span className="text-xs text-slate-500">For systems not on site</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sectionsWithPending.map((section) => (
          <button
            key={section.key}
            type="button"
            disabled={locked || pending}
            onClick={() => markSectionNa(section.key)}
            className={cn(
              "shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left transition active:scale-[0.98] disabled:opacity-50",
              "hover:border-slate-500 hover:bg-slate-800",
            )}
          >
            <span className="block text-xs font-semibold text-slate-200">{section.label}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              N/A · {section.pendingCount} item{section.pendingCount === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-center text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p role="status" className="text-center text-xs text-slate-400">
          Updating section…
        </p>
      ) : null}
    </div>
  );
}
