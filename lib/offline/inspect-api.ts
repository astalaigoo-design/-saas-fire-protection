import type {
  InspectActionResponse,
  InspectionFetchResponse,
} from "@/lib/offline/inspection-types";

async function parseJsonResponse(response: Response): Promise<InspectActionResponse> {
  const body = (await response.json()) as InspectActionResponse;
  if (!response.ok && !body.ok) return body;
  return body;
}

export async function apiFetchInspection(
  inspectionId: string,
): Promise<InspectionFetchResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}`, {
    credentials: "include",
  });
  return (await response.json()) as InspectionFetchResponse;
}

export async function apiStartInspection(
  inspectionId: string,
  idempotencyKey?: string,
): Promise<InspectActionResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}/start`, {
    method: "POST",
    credentials: "include",
    headers: idempotencyKey ? { "x-idempotency-key": idempotencyKey } : undefined,
  });
  return parseJsonResponse(response);
}

export async function apiSubmitInspection(
  inspectionId: string,
  signatureData: string,
  idempotencyKey?: string,
): Promise<InspectActionResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}/submit`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ signatureData }),
  });
  return parseJsonResponse(response);
}

export async function apiUpdateChecklistItem(
  inspectionId: string,
  input: { itemId: string; result: string; notes?: string },
  idempotencyKey?: string,
): Promise<InspectActionResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}/checklist`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function apiUploadPhoto(
  inspectionId: string,
  input: { tempId: string; dataUrl: string; caption?: string },
  idempotencyKey?: string,
): Promise<InspectActionResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}/photos`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function apiDeletePhoto(
  inspectionId: string,
  photoId: string,
  idempotencyKey?: string,
): Promise<InspectActionResponse> {
  const response = await fetch(`/api/inspect/${inspectionId}/photos/${photoId}`, {
    method: "DELETE",
    credentials: "include",
    headers: idempotencyKey ? { "x-idempotency-key": idempotencyKey } : undefined,
  });
  return parseJsonResponse(response);
}
