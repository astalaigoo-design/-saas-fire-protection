"use client";

import { InspectionItemResult } from "@prisma/client";
import { useState, useTransition } from "react";
import { updateChecklistItem } from "@/lib/inspect/actions";

export type ChecklistItemState = {
  id: string;
  label: string;
  description: string | null;
  result: InspectionItemResult;
  notes: string | null;
};

type ChecklistItemCardProps = {
  inspectionId: string;
  item: ChecklistItemState;
  index: number;
  total: number;
  locked: boolean;
  onUpdated: (item: ChecklistItemState) => void;
};

const resultOptions = [
  { value: InspectionItemResult.pass, label: "Pass", className: "bg-emerald-600 hover:bg-emerald-500" },
  { value: InspectionItemResult.fail, label: "Fail", className: "bg-red-600 hover:bg-red-500" },
  { value: InspectionItemResult.na, label: "N/A", className: "bg-slate-600 hover:bg-slate-500" },
] as const;

export function ChecklistItemCard({
  inspectionId,
  item,
  index,
  total,
  locked,
  onUpdated,
}: ChecklistItemCardProps) {
  const [failNote, setFailNote] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const applyResult = (result: InspectionItemResult) => {
    if (locked || pending) return;
    setError(null);

    if (result === InspectionItemResult.fail && !failNote.trim()) {
      setError("Add a note before marking as Fail.");
      return;
    }

    startTransition(async () => {
      const response = await updateChecklistItem({
        inspectionId,
        itemId: item.id,
        result,
        notes: result === InspectionItemResult.fail ? failNote.trim() : undefined,
      });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      onUpdated({
        ...item,
        result,
        notes: result === InspectionItemResult.fail ? failNote.trim() : null,
      });
    });
  };

  return (
    <article className="flex h-full w-[min(24rem,calc(100vw-2rem))] shrink-0 snap-center flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
      <p className="text-xs font-medium text-slate-500">
        Item {index + 1} of {total}
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-white">{item.label}</h2>
      {item.description ? (
        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
      ) : null}

      <div className="mt-auto space-y-4 pt-6">
        <div className="grid grid-cols-3 gap-2">
          {resultOptions.map((option) => {
            const selected = item.result === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={locked || pending}
                onClick={() => applyResult(option.value)}
                className={`min-h-12 rounded-xl px-2 text-sm font-semibold text-white transition ring-2 ${
                  selected ? "ring-amber-400" : "ring-transparent"
                } ${option.className} disabled:opacity-50`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {item.result === InspectionItemResult.fail || error ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-red-300">
              Failure note <span className="text-red-400">*</span>
            </span>
            <textarea
              value={failNote}
              disabled={locked || pending}
              onChange={(event) => setFailNote(event.target.value)}
              onBlur={() => {
                if (item.result === InspectionItemResult.fail && failNote.trim()) {
                  applyResult(InspectionItemResult.fail);
                }
              }}
              rows={3}
              placeholder="Describe the issue…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </label>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {pending ? (
          <p role="status" className="text-xs text-slate-400">
            Saving…
          </p>
        ) : null}
      </div>
    </article>
  );
}
