"use client";

import { useRef, useState, useTransition } from "react";
import { compressImageFile } from "@/lib/inspect/compress-image";
import { enqueueOfflineMutation } from "@/lib/offline/indexeddb";
import { apiUploadPhoto } from "@/lib/offline/inspect-api";
import { OfflineBadge } from "@/components/inspect/offline-badge";

type FailItemPhotoProps = {
  inspectionId: string;
  itemLabel: string;
  disabled: boolean;
  onPhotoAdded: (photo: { id: string; url: string; caption: string | null }) => void;
};

export function FailItemPhotoCapture({
  inspectionId,
  itemLabel,
  disabled,
  onPhotoAdded,
}: FailItemPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    setError(null);
    setSavedOffline(false);

    startTransition(async () => {
      try {
        const dataUrl = await compressImageFile(file);
        const tempId = `temp-${Date.now()}`;
        const caption = `Fail: ${itemLabel}`;

        const saveOffline = async () => {
          await enqueueOfflineMutation({
            inspectionId,
            type: "photo.upload",
            payload: { tempId, dataUrl, caption },
          });
          setSavedOffline(true);
          onPhotoAdded({ id: tempId, url: dataUrl, caption });
        };

        if (!navigator.onLine) {
          await saveOffline();
          return;
        }

        try {
          const response = await apiUploadPhoto(inspectionId, { tempId, dataUrl, caption });
          if (!response.ok) {
            setError(response.error);
            return;
          }
          onPhotoAdded({
            id: response.photoId ?? tempId,
            url: response.url ?? dataUrl,
            caption,
          });
        } catch {
          await saveOffline();
        }
      } catch {
        setError("Could not process photo. Try again.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-red-500/40 bg-red-950/40 px-3 text-sm font-semibold text-red-200 hover:bg-red-950/60 disabled:opacity-50"
      >
        <span aria-hidden>📷</span>
        {pending ? "Saving photo…" : "Add photo of deficiency"}
      </button>
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
      {savedOffline ? <OfflineBadge className="w-full justify-center" /> : null}
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
