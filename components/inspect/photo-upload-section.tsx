"use client";

import { useRef, useState, useTransition } from "react";
import { compressImageFile } from "@/lib/inspect/compress-image";
import {
  enqueueOfflineMutation,
  removeTempPhotoUploads,
} from "@/lib/offline/indexeddb";
import { apiDeletePhoto, apiUploadPhoto } from "@/lib/offline/inspect-api";

type PhotoRecord = {
  id: string;
  url: string;
  caption: string | null;
};

type PhotoUploadSectionProps = {
  inspectionId: string;
  photos: PhotoRecord[];
  locked: boolean;
  onPhotosChange: (photos: PhotoRecord[]) => void;
};

export function PhotoUploadSection({
  inspectionId,
  photos,
  locked,
  onPhotosChange,
}: PhotoUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | undefined) => {
    if (!file || locked) return;
    setError(null);

    startTransition(async () => {
      try {
        const dataUrl = await compressImageFile(file);
        const tempId = `temp-${Date.now()}`;
        const fallbackPhoto = {
          id: tempId,
          url: dataUrl,
          caption: null,
        };

        const saveOffline = async () => {
          await enqueueOfflineMutation({
            inspectionId,
            type: "photo.upload",
            payload: { tempId, dataUrl },
          });
          setSyncNotice("Photo saved offline. It will upload when online.");
          onPhotosChange([...photos, fallbackPhoto]);
        };

        if (!navigator.onLine) {
          await saveOffline();
          return;
        }

        const response = await apiUploadPhoto(inspectionId, {
          tempId,
          dataUrl,
        });
        if (!response.ok) {
          setError(response.error);
          return;
        }
        setSyncNotice(null);
        onPhotosChange([
          ...photos,
          {
            id: response.photoId ?? tempId,
            url: response.url ?? dataUrl,
            caption: null,
          },
        ]);
      } catch {
        setError("Could not process photo. Try again.");
      }
    });
  };

  const removePhoto = (photoId: string) => {
    if (locked) return;
    startTransition(async () => {
      if (photoId.startsWith("temp-")) {
        await removeTempPhotoUploads(inspectionId, photoId);
        onPhotosChange(photos.filter((photo) => photo.id !== photoId));
        return;
      }

      const saveOfflineDelete = async () => {
        await enqueueOfflineMutation({
          inspectionId,
          type: "photo.delete",
          payload: { photoId },
        });
        setSyncNotice("Photo deletion queued offline.");
        onPhotosChange(photos.filter((photo) => photo.id !== photoId));
      };

      if (!navigator.onLine) {
        await saveOfflineDelete();
        return;
      }

      try {
        const response = await apiDeletePhoto(inspectionId, photoId);
        if (!response.ok) {
          setError(response.error);
          return;
        }
        setSyncNotice(null);
        onPhotosChange(photos.filter((photo) => photo.id !== photoId));
      } catch {
        await saveOfflineDelete();
      }
    });
  };

  return (
    <section className="space-y-3 px-4" aria-label="Photos">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Photos</h2>
        {!locked ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-medium text-amber-400 hover:bg-slate-700 disabled:opacity-50"
          >
            <span aria-hidden>📷</span>
            {pending ? "Uploading…" : "Add photo"}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
          No photos yet. Tap Add photo to use your camera.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Inspection"
                className="aspect-square w-full object-cover"
              />
              {!locked ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 min-h-9 min-w-9 rounded-full bg-slate-950/80 px-2 text-xs text-red-300"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {pending ? (
        <p role="status" className="text-sm text-slate-400">
          Processing photo…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {syncNotice ? (
        <p role="status" className="text-xs text-amber-200">
          {syncNotice}
        </p>
      ) : null}
    </section>
  );
}
