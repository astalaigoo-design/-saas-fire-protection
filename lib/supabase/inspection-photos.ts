import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseStorageConfig } from "@/lib/supabase/env";

type ParsedDataUrl = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

export function parseImageDataUrl(dataUrl: string): ParsedDataUrl {
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid image data.");
  }

  const contentType = match[1].toLowerCase();
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    throw new Error("Image file is empty.");
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";

  return { buffer, contentType, extension };
}

export function buildInspectionPhotoPath(
  companyId: string,
  inspectionId: string,
  extension: string,
  photoId = randomUUID(),
): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "") || "jpg";
  return `${companyId}/${inspectionId}/${photoId}.${safeExt}`;
}

export function getPublicStorageUrl(objectPath: string): string {
  const { url, bucket } = getSupabaseStorageConfig();
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${url}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/** Returns storage object path if URL is a Supabase public object URL for our bucket. */
export function storagePathFromPhotoUrl(photoUrl: string): string | null {
  if (photoUrl.startsWith("data:")) return null;

  const { url, bucket } = getSupabaseStorageConfig();
  const prefix = `${url}/storage/v1/object/public/${bucket}/`;
  if (!photoUrl.startsWith(prefix)) return null;

  return decodeURIComponent(photoUrl.slice(prefix.length));
}

export async function uploadInspectionPhotoToStorage(input: {
  companyId: string;
  inspectionId: string;
  dataUrl: string;
}): Promise<{ objectPath: string; publicUrl: string }> {
  const { buffer, contentType, extension } = parseImageDataUrl(input.dataUrl);
  const objectPath = buildInspectionPhotoPath(
    input.companyId,
    input.inspectionId,
    extension,
  );

  const supabase = getSupabaseAdmin();
  const { bucket } = getSupabaseStorageConfig();

  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || "Could not upload photo to storage.");
  }

  return {
    objectPath,
    publicUrl: getPublicStorageUrl(objectPath),
  };
}

export async function deleteInspectionPhotoFromStorage(photoUrl: string): Promise<void> {
  const objectPath = storagePathFromPhotoUrl(photoUrl);
  if (!objectPath) return;

  const supabase = getSupabaseAdmin();
  const { bucket } = getSupabaseStorageConfig();

  const { error } = await supabase.storage.from(bucket).remove([objectPath]);
  if (error) {
    throw new Error(error.message || "Could not delete photo from storage.");
  }
}
