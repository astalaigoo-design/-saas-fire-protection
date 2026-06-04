"use client";

import { InspectionItemResult } from "@prisma/client";
import type { AssetType } from "@prisma/client";
import { useState, useTransition } from "react";
import { OfflineBadge } from "@/components/inspect/offline-badge";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingAssetLabel } from "@/lib/assets/format";
import { enqueueOfflineMutation } from "@/lib/offline/indexeddb";
import { apiUpdateInspectionAssetCheck } from "@/lib/offline/inspect-api";
import { formatDate } from "@/lib/dashboard/dates";

export type AssetCheckState = {
  id: string;
  result: InspectionItemResult;
  notes: string | null;
  servicedAt: Date | null;
  asset: {
    id: string;
    assetType: AssetType;
    tagNumber: string | null;
    location: string;
    manufacturer: string | null;
    model: string | null;
  };
};

type EquipmentRegisterSectionProps = {
  inspectionId: string;
  assetChecks: AssetCheckState[];
  locked: boolean;
  onAssetChecksChange: (checks: AssetCheckState[]) => void;
};

const resultButtonClass = (active: boolean, tone: "pass" | "fail" | "na") => {
  const base =
    "min-h-11 flex-1 rounded-xl border px-2 text-sm font-semibold transition-colors";
  if (!active) {
    return `${base} border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500`;
  }
  if (tone === "pass") return `${base} border-emerald-500 bg-emerald-500/20 text-emerald-200`;
  if (tone === "fail") return `${base} border-red-500 bg-red-500/20 text-red-200`;
  return `${base} border-slate-500 bg-slate-700 text-slate-100`;
};

function AssetCheckCard({
  inspectionId,
  check,
  locked,
  onUpdated,
}: {
  inspectionId: string;
  check: AssetCheckState;
  locked: boolean;
  onUpdated: (check: AssetCheckState) => void;
}) {
  const [failNote, setFailNote] = useState(check.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  const persistResult = (result: InspectionItemResult, notes?: string) => {
    if (locked || pending) return;
    setError(null);

    startTransition(async () => {
      const optimistic: AssetCheckState = {
        ...check,
        result,
        notes: notes ?? null,
      };

      const enqueueAsOffline = async () => {
        await enqueueOfflineMutation({
          inspectionId,
          type: "asset.update",
          payload: {
            assetCheckId: check.id,
            result,
            notes,
          },
        });
        setSavedOffline(true);
        onUpdated(optimistic);
      };

      if (!navigator.onLine) {
        await enqueueAsOffline();
        return;
      }

      try {
        const response = await apiUpdateInspectionAssetCheck(inspectionId, {
          assetCheckId: check.id,
          result,
          notes,
        });
        if (!response.ok) {
          setError(response.error);
          return;
        }
        setSavedOffline(false);
        onUpdated(optimistic);
      } catch {
        await enqueueAsOffline();
      }
    });
  };

  const label = buildingAssetLabel({
    assetType: check.asset.assetType,
    tagNumber: check.asset.tagNumber,
    location: check.asset.location,
  });

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {assetTypeLabel(check.asset.assetType)}
            {check.asset.manufacturer || check.asset.model
              ? ` · ${[check.asset.manufacturer, check.asset.model].filter(Boolean).join(" ")}`
              : null}
          </p>
        </div>
        {check.servicedAt ? (
          <p className="text-xs text-emerald-300/90">
            Serviced {formatDate(check.servicedAt)}
          </p>
        ) : null}
      </div>

      {locked ? (
        <p className="mt-3 text-sm capitalize text-slate-300">{check.result.replace(/_/g, " ")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={resultButtonClass(
                check.result === InspectionItemResult.pass,
                "pass",
              )}
              onClick={() => persistResult(InspectionItemResult.pass)}
            >
              Pass
            </button>
            <button
              type="button"
              disabled={pending}
              className={resultButtonClass(
                check.result === InspectionItemResult.fail,
                "fail",
              )}
              onClick={() => persistResult(InspectionItemResult.fail)}
            >
              Fail
            </button>
            <button
              type="button"
              disabled={pending}
              className={resultButtonClass(check.result === InspectionItemResult.na, "na")}
              onClick={() => persistResult(InspectionItemResult.na)}
            >
              N/A
            </button>
          </div>

          {check.result === InspectionItemResult.fail ? (
            <div className="space-y-2">
              <label htmlFor={`asset-note-${check.id}`} className="text-xs text-slate-400">
                Note (required for fail)
              </label>
              <textarea
                id={`asset-note-${check.id}`}
                value={failNote}
                onChange={(e) => setFailNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="What failed or needs repair?"
              />
              <button
                type="button"
                disabled={pending || !failNote.trim()}
                className="min-h-10 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => persistResult(InspectionItemResult.fail, failNote.trim())}
              >
                Save note
              </button>
            </div>
          ) : null}
        </div>
      )}

      {check.notes && locked ? (
        <p className="mt-2 text-sm text-slate-400">{check.notes}</p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {savedOffline ? (
        <div className="mt-2">
          <OfflineBadge label="Saved locally" />
        </div>
      ) : null}
    </article>
  );
}

export function EquipmentRegisterSection({
  inspectionId,
  assetChecks,
  locked,
  onAssetChecksChange,
}: EquipmentRegisterSectionProps) {
  if (assetChecks.length === 0) return null;

  const pendingCount = assetChecks.filter(
    (c) => c.result === InspectionItemResult.pending,
  ).length;

  return (
    <section className="space-y-4 px-4" aria-labelledby="equipment-register-heading">
      <div>
        <h2 id="equipment-register-heading" className="text-lg font-semibold text-white">
          Equipment register
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Mark each item on site. Pass updates last service on submit.
          {pendingCount > 0 && !locked
            ? ` ${pendingCount} remaining.`
            : null}
        </p>
      </div>
      <ul className="space-y-3">
        {assetChecks.map((check) => (
          <li key={check.id}>
            <AssetCheckCard
              inspectionId={inspectionId}
              check={check}
              locked={locked}
              onUpdated={(updated) => {
                onAssetChecksChange(
                  assetChecks.map((row) => (row.id === updated.id ? updated : row)),
                );
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
