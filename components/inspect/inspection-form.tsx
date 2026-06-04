"use client";

import { InspectionItemResult, InspectionStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BuildingHeader } from "@/components/inspect/building-header";
import { PreJobBriefCard } from "@/components/inspect/pre-job-brief-card";
import { ChecklistCarousel } from "@/components/inspect/checklist-carousel";
import {
  EquipmentRegisterSection,
  type AssetCheckState,
} from "@/components/inspect/equipment-register-section";
import { PhotoUploadSection } from "@/components/inspect/photo-upload-section";
import { DownloadReportButton } from "@/components/inspect/download-report-button";
import { OfflineBadge } from "@/components/inspect/offline-badge";
import { InspectBillingBlock } from "@/components/inspect/inspect-billing-block";
import { SignaturePad } from "@/components/inspect/signature-pad";
import type { AppRole } from "@/lib/auth/roles";
import type { ChecklistItemState } from "@/components/inspect/checklist-item-card";
import {
  enqueueOfflineMutation,
  listOfflineMutations,
  saveInspectionSnapshot,
} from "@/lib/offline/indexeddb";
import { apiStartInspection, apiSubmitInspection } from "@/lib/offline/inspect-api";
import { syncOfflineInspectionMutations } from "@/lib/offline/inspection-sync";
import type { PreJobBrief } from "@/lib/inspect/pre-job-brief";
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
  writeAccess?: boolean;
  billingMessage?: string;
  checkoutUrl?: string | null;
  inlineCheckoutReady?: boolean;
  designPartner?: boolean;
  role?: AppRole;
  preJobBrief?: PreJobBrief | null;
};

export function InspectionForm({
  inspection,
  offlineOnly = false,
  writeAccess = true,
  billingMessage = "Subscribe to continue using GetFlareflow.",
  checkoutUrl = null,
  inlineCheckoutReady = false,
  designPartner = false,
  role = "technician",
  preJobBrief = null,
}: InspectionFormProps) {
  const router = useRouter();
  const serverLocked =
    inspection.status === "completed" || inspection.status === "cancelled";
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const [items, setItems] = useState<ChecklistItemState[]>(() =>
    inspection.items.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      result: item.result,
      notes: item.notes,
    })),
  );
  const [assetChecks, setAssetChecks] = useState<AssetCheckState[]>(() =>
    inspection.assetChecks.map((check) => ({
      id: check.id,
      result: check.result,
      notes: check.notes,
      servicedAt: check.servicedAt,
      asset: check.buildingAsset,
    })),
  );
  const [signature, setSignature] = useState<string | null>(
    inspection.signatureData,
  );
  const [photos, setPhotos] = useState<InspectionPhoto[]>(() => inspection.photos);
  const readOnly = !writeAccess;
  const formLocked = serverLocked || submittedOffline;
  const locked = formLocked || readOnly;
  const displayInspection = submittedOffline
    ? {
        ...inspection,
        status: InspectionStatus.completed,
        signatureData: signature,
        completedAt: inspection.completedAt ?? new Date(),
        signedAt: inspection.signedAt ?? new Date(),
      }
    : inspection;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<ReportEmailOutcome | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pending, startTransition] = useTransition();

  const showOfflineBadge =
    isHydrated && (offlineOnly || !isOnline || pendingSyncCount > 0 || submittedOffline);

  useEffect(() => {
    let isMounted = true;
    const runSync = async () => {
      const hadSuccess = await syncOfflineInspectionMutations(inspection.id, {
        onMutationError: () => {
          /* badge reflects pending count */
        },
      });
      const pendingMutations = await listOfflineMutations(inspection.id);

      if (!isMounted) return;
      setPendingSyncCount(pendingMutations.length);

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

    const mergedAssetChecks = inspection.assetChecks.map((serverCheck) => {
      const local = assetChecks.find((row) => row.id === serverCheck.id);
      if (!local) return serverCheck;
      return {
        ...serverCheck,
        result: local.result,
        notes: local.notes,
        servicedAt: local.servicedAt,
      };
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
  }, [inspection, items, assetChecks, photos, signature]);

  useEffect(() => {
    if (!locked && inspection.status === "scheduled") {
      void (async () => {
        if (offlineOnly || !navigator.onLine) {
          await enqueueOfflineMutation({
            inspectionId: inspection.id,
            type: "inspection.start",
            payload: {},
          });
          const pendingMutations = await listOfflineMutations(inspection.id);
          setPendingSyncCount(pendingMutations.length);
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
  const allAssetsComplete =
    assetChecks.length === 0 ||
    assetChecks.every((check) => check.result !== InspectionItemResult.pending);
  const assetFailNotesValid = assetChecks.every(
    (check) =>
      check.result !== InspectionItemResult.fail || Boolean(check.notes?.trim()),
  );

  const handleDone = () => {
    if (formLocked || readOnly) return;
    setSubmitError(null);

    if (!allItemsComplete) {
      setSubmitError("Complete every checklist item before finishing.");
      return;
    }
    if (!failNotesValid) {
      setSubmitError("Every failed item needs a note.");
      return;
    }
    if (!allAssetsComplete) {
      setSubmitError("Mark every equipment item in the register before finishing.");
      return;
    }
    if (!assetFailNotesValid) {
      setSubmitError("Every failed equipment item needs a note.");
      return;
    }
    if (!signature) {
      setSubmitError("Sign above to finish this inspection.");
      return;
    }

    startTransition(async () => {
      if (offlineOnly || !navigator.onLine) {
        await enqueueOfflineMutation({
          inspectionId: inspection.id,
          type: "inspection.submit",
          payload: { signatureData: signature },
        });
        setSubmittedOffline(true);
        const pendingMutations = await listOfflineMutations(inspection.id);
        setPendingSyncCount(pendingMutations.length);
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

  const handlePhotoAdded = (photo: InspectionPhoto) => {
    setPhotos((current) => [...current, photo]);
    void listOfflineMutations(inspection.id).then((mutations) =>
      setPendingSyncCount(mutations.length),
    );
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-slate-50">
      {showOfflineBadge ? (
        <div className="sticky top-0 z-20 flex justify-center border-b border-amber-500/20 bg-slate-950/95 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
          <OfflineBadge
            label={
              submittedOffline
                ? "Saved locally — will sync when online"
                : pendingSyncCount > 0 && isOnline
                  ? `Syncing ${pendingSyncCount} change${pendingSyncCount === 1 ? "" : "s"}…`
                  : "Saved locally — will sync"
            }
          />
        </div>
      ) : null}

      <BuildingHeader inspection={displayInspection} locked={locked} />

      <main className="flex-1 space-y-8 py-6 pb-48">
        {!locked && preJobBrief ? <PreJobBriefCard brief={preJobBrief} /> : null}

        <ChecklistCarousel
          inspectionId={inspection.id}
          items={items}
          photos={photos}
          locked={locked}
          onItemsChange={setItems}
          onPhotoAdded={handlePhotoAdded}
        />

        <EquipmentRegisterSection
          inspectionId={inspection.id}
          assetChecks={assetChecks}
          locked={locked}
          onAssetChecksChange={setAssetChecks}
        />

        {locked && photos.length > 0 ? (
          <PhotoUploadSection
            inspectionId={inspection.id}
            photos={photos}
            locked
            onPhotosChange={setPhotos}
          />
        ) : null}
      </main>

      <footer className="sticky bottom-0 border-t border-slate-800 bg-slate-900/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {formLocked ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-center">
              <p className="text-2xl font-bold text-emerald-300">Done</p>
              <p className="mt-1 text-sm text-emerald-200/90">
                {submittedOffline
                  ? "Inspection saved on this device. It will sync when you are back online."
                  : "Inspection submitted and locked."}
                {assetChecks.length > 0
                  ? " Equipment service dates updated for passed items."
                  : null}
              </p>
            </div>

            {displayInspection.signatureData ? (
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayInspection.signatureData}
                  alt="Submitted signature"
                  className="h-24 w-full object-contain"
                />
              </div>
            ) : null}

            {emailNotice ? (
              <p
                role="status"
                className={`text-center text-sm ${
                  emailNotice.status === "sent" ? "text-emerald-300" : "text-amber-200"
                }`}
              >
                {emailNotice.status === "sent"
                  ? `Report emailed to ${emailNotice.to}.`
                  : emailNotice.reason}
              </p>
            ) : null}

            <div className="flex w-full flex-col gap-3">
              {submittedOffline && !isOnline ? (
                <p className="text-center text-xs text-amber-200">
                  Report download will be available after this inspection syncs online.
                </p>
              ) : (
                <DownloadReportButton inspectionId={inspection.id} />
              )}
              <Link
                href="/dashboard/my-jobs"
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-bold text-white hover:bg-emerald-500"
              >
                Back to my jobs
              </Link>
            </div>
          </div>
        ) : readOnly ? (
          <InspectBillingBlock
            message={billingMessage}
            role={role}
            checkoutUrl={checkoutUrl}
            inlineCheckoutReady={inlineCheckoutReady}
            designPartner={designPartner}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Finish inspection</h2>
              <p className="text-xs text-slate-400">Sign below, then tap Done to submit.</p>
            </div>

            <SignaturePad
              disabled={locked || pending}
              initialDataUrl={inspection.signatureData}
              onChange={setSignature}
            />

            {submitError ? (
              <p role="alert" className="text-center text-sm text-red-300">
                {submitError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={pending}
              onClick={handleDone}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.99]"
            >
              {pending ? "Submitting…" : "Done"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
