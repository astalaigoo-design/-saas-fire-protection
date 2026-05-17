"use client";

import { useRef, useState, useTransition } from "react";
import { compressImageFile } from "@/lib/inspect/compress-image";
import {
  deleteInspectionPhoto,
  uploadInspectionPhoto,
} from "@/lib/inspect/actions";

type PhotoRecord = {
  id: string;
  url: string;
  caption: string | null;
};

type PhotoUploadSectionProps = {
  inspectionId: string;
  photos: PhotoRecord[];
  locked: boolean;
};

export function PhotoUploadSection({
  inspectionId,
  photos: initialPhotos,
  locked,
}: PhotoUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | undefined) => {
    if (!file || locked) return;
    setError(null);

    startTransition(async () => {
      try {
        const dataUrl = await compressImageFile(file);
        const response = await uploadInspectionPhoto({
          inspectionId,
          dataUrl,
        });
        if (!response.ok) {
          setError(response.error);
          return;
        }
        setPhotos((current) => [
          ...current,
          {
            id: response.photoId ?? `temp-${Date.now()}`,
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
      const response = await deleteInspectionPhoto(inspectionId, photoId);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
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
        <ul className="grid grid-cols-2 gap-3">
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

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
