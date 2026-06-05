import {
  listOfflineMutations,
  markOfflineMutationAttempt,
  removeOfflineMutation,
} from "@/lib/offline/indexeddb";
import {
  apiDeletePhoto,
  apiRecordVisitArrival,
  apiStartInspection,
  apiSubmitInspection,
  apiUpdateChecklistItem,
  apiUpdateInspectionAssetCheck,
  apiUploadPhoto,
} from "@/lib/offline/inspect-api";
import type {
  InspectActionResponse,
  OfflineMutation,
  OfflineMutationPayloadMap,
} from "@/lib/offline/inspection-types";

type SyncCallbacks = {
  onMutationSuccess?: (mutation: OfflineMutation, response: InspectActionResponse) => void;
  onMutationError?: (mutation: OfflineMutation, error: string) => void;
};

async function sendMutation(mutation: OfflineMutation): Promise<InspectActionResponse> {
  switch (mutation.type) {
    case "inspection.start":
      return apiStartInspection(mutation.inspectionId, mutation.idempotencyKey);
    case "inspection.arrive": {
      const payload = mutation.payload as OfflineMutationPayloadMap["inspection.arrive"];
      return apiRecordVisitArrival(
        mutation.inspectionId,
        payload.coordinates,
        mutation.idempotencyKey,
      );
    }
    case "checklist.update": {
      const payload = mutation.payload as OfflineMutationPayloadMap["checklist.update"];
      return apiUpdateChecklistItem(
        mutation.inspectionId,
        {
          itemId: payload.itemId,
          result: payload.result,
          notes: payload.notes,
        },
        mutation.idempotencyKey,
      );
    }
    case "asset.update": {
      const payload = mutation.payload as OfflineMutationPayloadMap["asset.update"];
      return apiUpdateInspectionAssetCheck(
        mutation.inspectionId,
        {
          assetCheckId: payload.assetCheckId,
          result: payload.result,
          notes: payload.notes,
        },
        mutation.idempotencyKey,
      );
    }
    case "photo.upload": {
      const payload = mutation.payload as OfflineMutationPayloadMap["photo.upload"];
      return apiUploadPhoto(
        mutation.inspectionId,
        {
          tempId: payload.tempId,
          dataUrl: payload.dataUrl,
          caption: payload.caption,
        },
        mutation.idempotencyKey,
      );
    }
    case "photo.delete": {
      const payload = mutation.payload as OfflineMutationPayloadMap["photo.delete"];
      return apiDeletePhoto(
        mutation.inspectionId,
        payload.photoId,
        mutation.idempotencyKey,
      );
    }
    case "inspection.submit": {
      const payload = mutation.payload as OfflineMutationPayloadMap["inspection.submit"];
      return apiSubmitInspection(
        mutation.inspectionId,
        {
          signatureData: payload.signatureData,
          submitCoordinates: payload.submitCoordinates,
          mileageMiles: payload.mileageMiles,
        },
        mutation.idempotencyKey,
      );
    }
    default:
      return { ok: false, error: "Unknown offline mutation type." };
  }
}

export async function syncOfflineInspectionMutations(
  inspectionId?: string,
  callbacks?: SyncCallbacks,
): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }

  const mutations = await listOfflineMutations(inspectionId);
  let hadSuccess = false;

  for (const mutation of mutations) {
    try {
      const response = await sendMutation(mutation);
      if (!response.ok) {
        await markOfflineMutationAttempt(mutation.id, response.error);
        callbacks?.onMutationError?.(mutation, response.error);
        break;
      }
      hadSuccess = true;
      await removeOfflineMutation(mutation.id);
      callbacks?.onMutationSuccess?.(mutation, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed syncing offline action.";
      await markOfflineMutationAttempt(mutation.id, message);
      callbacks?.onMutationError?.(mutation, message);
      break;
    }
  }

  return hadSuccess;
}
