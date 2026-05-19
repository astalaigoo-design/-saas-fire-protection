import {
  listOfflineMutations,
  markOfflineMutationAttempt,
  removeOfflineMutation,
} from "@/lib/offline/indexeddb";
import {
  apiDeletePhoto,
  apiStartInspection,
  apiSubmitInspection,
  apiUpdateChecklistItem,
  apiUploadPhoto,
} from "@/lib/offline/inspect-api";
import type { InspectActionResponse, OfflineMutation } from "@/lib/offline/inspection-types";

type SyncCallbacks = {
  onMutationSuccess?: (mutation: OfflineMutation, response: InspectActionResponse) => void;
  onMutationError?: (mutation: OfflineMutation, error: string) => void;
};

async function sendMutation(mutation: OfflineMutation): Promise<InspectActionResponse> {
  switch (mutation.type) {
    case "inspection.start":
      return apiStartInspection(mutation.inspectionId, mutation.idempotencyKey);
    case "checklist.update":
      return apiUpdateChecklistItem(
        mutation.inspectionId,
        {
          itemId: mutation.payload.itemId,
          result: mutation.payload.result,
          notes: mutation.payload.notes,
        },
        mutation.idempotencyKey,
      );
    case "photo.upload":
      return apiUploadPhoto(
        mutation.inspectionId,
        {
          tempId: mutation.payload.tempId,
          dataUrl: mutation.payload.dataUrl,
          caption: mutation.payload.caption,
        },
        mutation.idempotencyKey,
      );
    case "photo.delete":
      return apiDeletePhoto(
        mutation.inspectionId,
        mutation.payload.photoId,
        mutation.idempotencyKey,
      );
    case "inspection.submit":
      return apiSubmitInspection(
        mutation.inspectionId,
        mutation.payload.signatureData,
        mutation.idempotencyKey,
      );
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
