import type { InspectionItemResult } from "@prisma/client";
import type { ReportEmailOutcome } from "@/lib/reports/email-report-after-submit";

export type InspectActionResponse =
  | { ok: true; reportEmail?: ReportEmailOutcome; photoId?: string; url?: string }
  | { ok: false; error: string };

export type OfflineMutationType =
  | "inspection.start"
  | "checklist.update"
  | "photo.upload"
  | "photo.delete"
  | "inspection.submit";

export type OfflineMutationPayloadMap = {
  "inspection.start": {};
  "checklist.update": {
    itemId: string;
    result: InspectionItemResult;
    notes?: string;
  };
  "photo.upload": {
    tempId: string;
    dataUrl: string;
    caption?: string;
  };
  "photo.delete": {
    photoId: string;
  };
  "inspection.submit": {
    signatureData: string;
  };
};

export type OfflineMutation<T extends OfflineMutationType = OfflineMutationType> = {
  id: string;
  idempotencyKey: string;
  inspectionId: string;
  type: T;
  payload: OfflineMutationPayloadMap[T];
  createdAt: number;
  attempts: number;
  lastError: string | null;
};

export type CachedInspectionSnapshot = {
  inspectionId: string;
  snapshot: unknown;
  updatedAt: number;
};
