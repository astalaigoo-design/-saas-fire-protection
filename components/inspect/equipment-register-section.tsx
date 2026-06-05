"use client";

import { InspectionItemResult } from "@prisma/client";
import type { AssetType } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";
import { BarcodeScannerSheet } from "@/components/scan/barcode-scanner-sheet";
import { OfflineBadge } from "@/components/inspect/offline-badge";
import { Button } from "@/components/ui/button";
import { assetTypeLabel } from "@/lib/assets/constants";
import { buildingAssetLabel } from "@/lib/assets/format";
import {
  buildAssetScanIndex,
  findAssetIdByScanValue,
} from "@/lib/assets/scan-match";
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
    barcodeValue: string | null;
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
  /** True when viewing a cached inspection with no register rows (open online once). */
  offlineRegisterUnavailable?: boolean;
  /** Hide camera scan when offline (pass/fail still works). */
  offlineMode?: boolean;
  /** When set, register scan uses the parent handler (shared with checklist scan). */
  onScanValue?: (value: string) => void;
  /** Highlight a register row after a shared scan (parent-controlled). */
  highlightedCheckId?: string | null;
  /** Hide the local scan button when a shared scan bar is shown above the checklist. */
  hideScanButton?: boolean;
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
  highlighted,
  onUpdated,
}: {
  inspectionId: string;
  check: AssetCheckState;
  locked: boolean;
  highlighted: boolean;
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
    <article
      id={`asset-check-${check.id}`}
      className={`scroll-mt-24 rounded-2xl border bg-slate-900/80 p-4 ${
        highlighted
          ? "border-amber-400 ring-2 ring-amber-400/60"
          : "border-slate-800"
      }`}
    >
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
  offlineRegisterUnavailable = false,
  offlineMode = false,
  onScanValue,
  highlightedCheckId = null,
  hideScanButton = false,
}: EquipmentRegisterSectionProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [localHighlightedId, setLocalHighlightedId] = useState<string | null>(null);
  const highlightedId = highlightedCheckId ?? localHighlightedId;

  const scanIndex = useMemo(
    () =>
      buildAssetScanIndex(
        assetChecks.map((check) => ({
          id: check.asset.id,
          tagNumber: check.asset.tagNumber,
          barcodeValue: check.asset.barcodeValue,
        })),
      ),
    [assetChecks],
  );

  if (offlineRegisterUnavailable) {
    return (
      <section className="space-y-3 px-4" aria-labelledby="equipment-register-heading">
        <h2 id="equipment-register-heading" className="text-lg font-semibold text-white">
          Equipment register
        </h2>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          This job was not opened online with the building equipment list, so the register is
          not available offline. Connect once, open this job from My jobs, then you can mark
          pass/fail offline on your next visit.
        </p>
      </section>
    );
  }

  if (assetChecks.length === 0) return null;

  const pendingCount = assetChecks.filter(
    (c) => c.result === InspectionItemResult.pending,
  ).length;

  const scrollToAssetCheck = (checkId: string) => {
    if (!onScanValue) {
      setLocalHighlightedId(checkId);
      window.setTimeout(() => setLocalHighlightedId(null), 4000);
    }
    document.getElementById(`asset-check-${checkId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleScan = (value: string) => {
    if (onScanValue) {
      onScanValue(value);
      return;
    }

    const assetId = findAssetIdByScanValue(value, scanIndex);
    if (!assetId) {
      setScanMessage(`No register item matches “${value.trim()}”.`);
      return;
    }
    const check = assetChecks.find((row) => row.asset.id === assetId);
    if (!check) {
      setScanMessage("Matched asset is not on this inspection.");
      return;
    }
    setScanMessage(null);
    scrollToAssetCheck(check.id);
  };

  return (
    <section className="space-y-4 px-4" aria-labelledby="equipment-register-heading">
      <div>
        <h2 id="equipment-register-heading" className="text-lg font-semibold text-white">
          Equipment register
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Optional — mark items you serviced. Pass updates last service on submit; leave
          unmarked items unchanged.
          {offlineMode ? " Saves locally when offline." : null}
          {pendingCount > 0 && !locked ? ` ${pendingCount} not marked yet.` : null}
        </p>
        {!locked && !offlineMode && !hideScanButton ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full border-slate-600 bg-slate-900 text-white sm:w-auto"
              onClick={() => setScanOpen(true)}
            >
              Scan QR / barcode
            </Button>
          </div>
        ) : null}
        {!locked && offlineMode ? (
          <p className="mt-2 text-xs text-slate-500">
            QR/barcode scan needs a connection. Scroll the list to mark pass, fail, or N/A.
          </p>
        ) : null}
        {scanMessage ? (
          <p className="mt-2 text-sm text-amber-200" role="status">
            {scanMessage}
          </p>
        ) : null}
      </div>

      {!onScanValue ? (
        <BarcodeScannerSheet
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScan={handleScan}
        />
      ) : null}
      <ul className="space-y-3">
        {assetChecks.map((check) => (
          <li key={check.id}>
            <AssetCheckCard
              inspectionId={inspectionId}
              check={check}
              locked={locked}
              highlighted={highlightedId === check.id}
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
