"use client";

import { InspectionItemResult } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BuildingHeader } from "@/components/inspect/building-header";
import { ChecklistCarousel } from "@/components/inspect/checklist-carousel";
import { PhotoUploadSection } from "@/components/inspect/photo-upload-section";
import { DownloadReportButton } from "@/components/inspect/download-report-button";
import { SignaturePad } from "@/components/inspect/signature-pad";
import type { ChecklistItemState } from "@/components/inspect/checklist-item-card";
import {
  enqueueOfflineMutation,
  listOfflineMutations,
  saveInspectionSnapshot,
} from "@/lib/offline/indexeddb";
import { apiStartInspection, apiSubmitInspection } from "@/lib/offline/inspect-api";
import { syncOfflineInspectionMutations } from "@/lib/offline/inspection-sync";
import type { InspectionFormData } from "@/lib/inspect/queries";
import type { ReportEmailOutcome } from "@/lib/reports/email-report-after-submit";

const emailNoticeKey = (inspectionId: string) => `inspect-email-notice-${inspectionId}`;

type InspectionPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

type InspectionFormProps = {
  inspection: InspectionFormData;
  offlineOnly?: boolean;
};

export function InspectionForm({ inspection, offlineOnly = false }: InspectionFormProps) {
  const router = useRouter();
  const locked = inspection.status === "completed" || inspection.status === "cancelled";
  const [items, setItems] = useState<ChecklistItemState[]>(() =>
    inspection.items.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      result: item.result,
      notes: item.notes,
    })),
  );
  const [signature, setSignature] = useState<string | null>(
    inspection.signatureData,
  );
  const [photos, setPhotos] = useState<InspectionPhoto[]>(() => inspection.photos);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<ReportEmailOutcome | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const runSync = async () => {
      const hadSuccess = await syncOfflineInspectionMutations(inspection.id, {
        onMutationError: (_mutation, error) => setSyncStatus(`Sync paused: ${error}`),
      });
      const pendingMutations = await listOfflineMutations(inspection.id);

      if (!isMounted) return;
      if (pendingMutations.length === 0) {
        setSyncStatus(null);
      } else if (isOnline) {
        setSyncStatus(`Syncing ${pendingMutations.length} offline update(s)…`);
      } else {
        setSyncStatus(`${pendingMutations.length} update(s) waiting for connection.`);
      }

      if (hadSuccess && !offlineOnly && navigator.onLine) router.refresh();
    };

    const handleOnline = () => {
      setIsOnline(true);
      void runSync();
    };
    const handleOffline = () => setIsOnline(false);

    setIsHydrated(true);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void runSync();

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [inspection.id, isOnline, offlineOnly, router]);

  useEffect(() => {
    const mergedItems = inspection.items.map((serverItem) => {
      const local = items.find((item) => item.id === serverItem.id);
      if (!local) return serverItem;
      return { ...serverItem, result: local.result, notes: local.notes };
    });

    const mergedPhotos = photos.map((photo, index) => {
      const existing = inspection.photos.find((row) => row.id === photo.id);
      if (existing) {
        return { ...existing, url: photo.url, caption: photo.caption };
      }
      return {
        id: photo.id,
        url: photo.url,
        caption: photo.caption,
        sortOrder: inspection.photos.length + index,
      };
    });

    void saveInspectionSnapshot({
      inspectionId: inspection.id,
      snapshot: {
        ...inspection,
        items: mergedItems,
        photos: mergedPhotos,
        signatureData: signature,
      },
      updatedAt: Date.now(),
    });
  }, [inspection, items, photos, signature]);

  useEffect(() => {
    if (!locked && inspection.status === "scheduled") {
      void (async () => {
        if (offlineOnly || !navigator.onLine) {
          await enqueueOfflineMutation({
            inspectionId: inspection.id,
            type: "inspection.start",
            payload: {},
          });
          setSyncStatus("Start action queued offline.");
          return;
        }

        const response = await apiStartInspection(inspection.id);
        if (!response.ok) {
          setSubmitError(response.error);
        }
      })().catch((error: unknown) => {
        console.error("startInspection failed", error);
      });
    }
  }, [inspection.id, inspection.status, locked, offlineOnly]);

  useEffect(() => {
    const raw = sessionStorage.getItem(emailNoticeKey(inspection.id));
    if (!raw) return;
    sessionStorage.removeItem(emailNoticeKey(inspection.id));
    try {
      setEmailNotice(JSON.parse(raw) as ReportEmailOutcome);
    } catch {
      /* ignore */
    }
  }, [inspection.id]);

  const allItemsComplete = items.every(
    (item) => item.result !== InspectionItemResult.pending,
  );
  const failNotesValid = items.every(
    (item) =>
      item.result !== InspectionItemResult.fail || Boolean(item.notes?.trim()),
  );

  const handleSubmit = () => {
    if (locked) return;
    setSubmitError(null);

    if (!allItemsComplete) {
      setSubmitError("Complete every checklist item before submitting.");
      return;
    }
    if (!failNotesValid) {
      setSubmitError("Every failed item needs a note.");
      return;
    }
    if (!signature) {
      setSubmitError("Add your signature before submitting.");
      return;
    }

    startTransition(async () => {
      if (offlineOnly || !navigator.onLine) {
        await enqueueOfflineMutation({
          inspectionId: inspection.id,
          type: "inspection.submit",
          payload: { signatureData: signature },
        });
        setSyncStatus("Inspection saved offline. Submission will sync when online.");
        return;
      }

      const response = await apiSubmitInspection(inspection.id, signature);
      if (!response.ok) {
        setSubmitError(response.error);
        return;
      }
      if (response.reportEmail) {
        sessionStorage.setItem(
          emailNoticeKey(inspection.id),
          JSON.stringify(response.reportEmail),
        );
      }
      if (!offlineOnly && navigator.onLine) router.refresh();
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-slate-50">
      <BuildingHeader inspection={inspection} locked={locked} />

      <main className="flex-1 space-y-8 py-6 pb-28">
        <ChecklistCarousel
          inspectionId={inspection.id}
          items={items}
          locked={locked}
          onItemsChange={setItems}
        />
        <PhotoUploadSection
          inspectionId={inspection.id}
          photos={photos}
          locked={locked}
          onPhotosChange={setPhotos}
        />

        <div className="px-4">
          {locked && inspection.signatureData ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Signature</p>
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspection.signatureData}
                  alt="Submitted signature"
                  className="h-36 w-full object-contain"
                />
              </div>
            </div>
          ) : (
            <SignaturePad
              disabled={locked || pending}
              initialDataUrl={inspection.signatureData}
              onChange={setSignature}
            />
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-slate-800 bg-slate-900/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {isHydrated && (offlineOnly || !isOnline) ? (
          <p role="status" className="mb-3 text-center text-xs text-amber-200">
            Offline mode: updates are saved on this device and synced when connection returns.
          </p>
        ) : null}
        {isHydrated && syncStatus ? (
          <p role="status" className="mb-3 text-center text-xs text-amber-200">
            {syncStatus}
          </p>
        ) : null}
        {pending ? (
          <p role="status" className="mb-3 text-center text-sm text-slate-300">
            Saving your inspection…
          </p>
        ) : null}
        {submitError ? (
          <p role="alert" className="mb-3 text-center text-sm text-red-300">
            {submitError}
          </p>
        ) : null}
        {emailNotice ? (
          <p
            role="status"
            className={`mb-3 text-center text-sm ${
              emailNotice.status === "sent" ? "text-emerald-300" : "text-amber-200"
            }`}
          >
            {emailNotice.status === "sent"
              ? `Report emailed to ${emailNotice.to}.`
              : emailNotice.reason}
          </p>
        ) : null}
        {locked ? (
          <div className="flex w-full flex-col gap-3">
            <DownloadReportButton inspectionId={inspection.id} />
            <Link
              href="/dashboard"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-white"
            >
              Done
            </Link>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit & lock inspection"}
          </button>
        )}
      </footer>
    </div>
  );
}
