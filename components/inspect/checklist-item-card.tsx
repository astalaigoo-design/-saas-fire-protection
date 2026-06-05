"use client";

import { InspectionItemResult } from "@prisma/client";
import { useState, useTransition } from "react";
import { FailItemPhotoCapture } from "@/components/inspect/fail-item-photo-capture";
import { OfflineBadge } from "@/components/inspect/offline-badge";
import { enqueueOfflineMutation } from "@/lib/offline/indexeddb";
import { apiUpdateChecklistItem } from "@/lib/offline/inspect-api";

export type ChecklistItemState = {
  id: string;
  label: string;
  description: string | null;
  linkedTagNumber: string | null;
  result: InspectionItemResult;
  notes: string | null;
};

type ChecklistItemCardProps = {
  inspectionId: string;
  item: ChecklistItemState;
  index: number;
  total: number;
  locked: boolean;
  highlighted?: boolean;
  itemPhotoCount: number;
  onUpdated: (item: ChecklistItemState) => void;
  onPhotoAdded: (photo: { id: string; url: string; caption: string | null }) => void;
};

export function ChecklistItemCard({
  inspectionId,
  item,
  index,
  total,
  locked,
  highlighted = false,
  itemPhotoCount,
  onUpdated,
  onPhotoAdded,
}: ChecklistItemCardProps) {
  const [failNote, setFailNote] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  const persistResult = (result: InspectionItemResult, notes?: string) => {
    if (locked || pending) return;
    setError(null);

    startTransition(async () => {
      const optimisticItem: ChecklistItemState = {
        ...item,
        result,
        notes: notes ?? null,
      };

      const enqueueAsOffline = async () => {
        await enqueueOfflineMutation({
          inspectionId,
          type: "checklist.update",
          payload: {
            itemId: item.id,
            result,
            notes,
          },
        });
        setSavedOffline(true);
        onUpdated(optimisticItem);
      };

      if (!navigator.onLine) {
        await enqueueAsOffline();
        return;
      }

      try {
        const response = await apiUpdateChecklistItem(inspectionId, {
          itemId: item.id,
          result,
          notes,
        });

        if (!response.ok) {
          setError(response.error);
          return;
        }

        setSavedOffline(false);
        onUpdated(optimisticItem);
      } catch {
        await enqueueAsOffline();
      }
    });
  };

  const applyResult = (result: InspectionItemResult) => {
    if (locked || pending) return;

    if (result === InspectionItemResult.fail) {
      if (!failNote.trim()) {
        onUpdated({ ...item, result, notes: null });
        setError(null);
        return;
      }
      persistResult(result, failNote.trim());
      return;
    }

    persistResult(result);
  };

  const isFail = item.result === InspectionItemResult.fail;

  return (
    <article
      id={`checklist-item-${item.id}`}
      className={`flex h-full w-[min(24rem,calc(100vw-2rem))] shrink-0 snap-center flex-col rounded-2xl border bg-slate-900 p-4 shadow-lg ${
        highlighted
          ? "border-amber-400 ring-2 ring-amber-400/60"
          : "border-slate-800"
      }`}
    >
      <p className="text-xs font-medium text-slate-500">
        Item {index + 1} of {total}
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-white">{item.label}</h2>
      {item.description ? (
        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
      ) : null}
      {item.linkedTagNumber ? (
        <p className="mt-2 text-xs text-slate-500">
          Register tag:{" "}
          <span className="font-medium text-slate-300">{item.linkedTagNumber}</span>
        </p>
      ) : null}

      <div className="mt-auto space-y-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={locked || pending}
            onClick={() => applyResult(InspectionItemResult.pass)}
            className={`min-h-[4.5rem] rounded-2xl text-lg font-bold text-white transition ring-2 ${
              item.result === InspectionItemResult.pass
                ? "bg-emerald-600 ring-amber-400"
                : "bg-emerald-700/90 ring-transparent hover:bg-emerald-600"
            } disabled:opacity-50 active:scale-[0.98]`}
          >
            Pass
          </button>
          <button
            type="button"
            disabled={locked || pending}
            onClick={() => applyResult(InspectionItemResult.fail)}
            className={`min-h-[4.5rem] rounded-2xl text-lg font-bold text-white transition ring-2 ${
              isFail
                ? "bg-red-600 ring-amber-400"
                : "bg-red-700/90 ring-transparent hover:bg-red-600"
            } disabled:opacity-50 active:scale-[0.98]`}
          >
            Fail
          </button>
        </div>

        <button
          type="button"
          disabled={locked || pending}
          onClick={() => applyResult(InspectionItemResult.na)}
          className={`min-h-12 w-full rounded-xl text-sm font-semibold text-white transition ring-2 ${
            item.result === InspectionItemResult.na
              ? "bg-slate-600 ring-amber-400"
              : "bg-slate-700 ring-transparent hover:bg-slate-600"
          } disabled:opacity-50 active:scale-[0.98]`}
        >
          N/A
        </button>

        {isFail || error ? (
          <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-950/20 p-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-red-300">
                What failed? <span className="text-red-400">*</span>
              </span>
              <textarea
                value={failNote}
                disabled={locked || pending}
                onChange={(event) => setFailNote(event.target.value)}
                onBlur={() => {
                  if (isFail && failNote.trim()) {
                    persistResult(InspectionItemResult.fail, failNote.trim());
                  }
                }}
                rows={3}
                placeholder="Describe the deficiency…"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </label>

            <FailItemPhotoCapture
              inspectionId={inspectionId}
              itemLabel={item.label}
              disabled={locked || pending}
              onPhotoAdded={onPhotoAdded}
            />

            {itemPhotoCount > 0 ? (
              <p className="text-xs text-emerald-300">
                {itemPhotoCount} photo{itemPhotoCount === 1 ? "" : "s"} attached
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {savedOffline ? <OfflineBadge className="w-full justify-center" /> : null}
        {pending ? (
          <p role="status" className="text-xs text-slate-400">
            Saving…
          </p>
        ) : null}
      </div>
    </article>
  );
}
