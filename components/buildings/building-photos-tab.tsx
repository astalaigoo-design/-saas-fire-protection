"use client";

import { useMemo, useState } from "react";
import type { BuildingInspectionRow } from "@/lib/buildings/queries";
import { formatDate } from "@/lib/dashboard/dates";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type PhotoGroup = {
  inspectionId: string;
  label: string;
  date: Date;
  photos: BuildingInspectionRow["photos"];
};

type BuildingPhotosTabProps = {
  inspections: BuildingInspectionRow[];
};

export function BuildingPhotosTab({ inspections }: BuildingPhotosTabProps) {
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);
  const [enlargedCaption, setEnlargedCaption] = useState<string | null>(null);

  const groups = useMemo((): PhotoGroup[] => {
    return inspections
      .filter((i) => i.photos.length > 0)
      .map((i) => ({
        inspectionId: i.id,
        label: i.inspectionType.name,
        date: i.completedAt ?? i.scheduledAt,
        photos: i.photos,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [inspections]);

  const totalPhotos = groups.reduce((n, g) => n + g.photos.length, 0);

  if (totalPhotos === 0) {
    return (
      <EmptyState
        title="No photos yet"
        description="Photos captured during inspections will appear here."
      />
    );
  }

  return (
    <>
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.inspectionId}>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {formatDate(group.date)} · {group.label}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.photos.map((photo) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEnlargedUrl(photo.url);
                      setEnlargedCaption(photo.caption);
                    }}
                    className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? "Inspection photo"}
                      className="size-full object-cover"
                    />
                  </button>
                  {photo.caption ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {photo.caption}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Dialog
        open={Boolean(enlargedUrl)}
        onOpenChange={(open) => {
          if (!open) {
            setEnlargedUrl(null);
            setEnlargedCaption(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl p-2 sm:p-4" showCloseButton>
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {enlargedUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enlargedUrl}
                alt={enlargedCaption ?? "Inspection photo"}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
              {enlargedCaption ? (
                <p className="px-1 text-sm text-muted-foreground">{enlargedCaption}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
