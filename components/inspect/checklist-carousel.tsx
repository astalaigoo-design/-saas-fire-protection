"use client";

import { useCallback, useRef, useState } from "react";
import { InspectionItemResult } from "@prisma/client";
import {
  ChecklistItemCard,
  type ChecklistItemState,
} from "@/components/inspect/checklist-item-card";
import { ChecklistSectionBulkNa } from "@/components/inspect/checklist-section-bulk-na";

type InspectionPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

type ChecklistCarouselProps = {
  inspectionId: string;
  items: ChecklistItemState[];
  photos: InspectionPhoto[];
  locked: boolean;
  onItemsChange: (items: ChecklistItemState[]) => void;
  onPhotoAdded: (photo: InspectionPhoto) => void;
};

function photosForItem(photos: InspectionPhoto[], itemLabel: string) {
  const prefix = `Fail: ${itemLabel}`;
  return photos.filter((photo) => photo.caption === prefix).length;
}

export function ChecklistCarousel({
  inspectionId,
  items,
  photos,
  locked,
  onItemsChange,
  onPhotoAdded,
}: ChecklistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const completedCount = items.filter(
    (item) => item.result !== InspectionItemResult.pending,
  ).length;

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !container.firstElementChild) return;
    const card = container.firstElementChild as HTMLElement;
    const gap = 12;
    const index = Math.round(container.scrollLeft / (card.offsetWidth + gap));
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
  }, [items.length]);

  const updateItem = (updated: ChecklistItemState) => {
    onItemsChange(items.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <section className="space-y-3" aria-label="Inspection checklist">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold text-white">Checklist</h2>
        <span className="text-sm text-slate-400">
          {completedCount}/{items.length} done
        </span>
      </div>

      <ChecklistSectionBulkNa
        inspectionId={inspectionId}
        items={items}
        locked={locked}
        onItemsChange={onItemsChange}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <ChecklistItemCard
            key={item.id}
            inspectionId={inspectionId}
            item={item}
            index={index}
            total={items.length}
            locked={locked}
            itemPhotoCount={photosForItem(photos, item.label)}
            onUpdated={updateItem}
            onPhotoAdded={onPhotoAdded}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1.5 px-4">
        {items.map((item, index) => (
          <span
            key={item.id}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-6 bg-amber-400" : "w-2 bg-slate-700"
            } ${
              item.result === InspectionItemResult.pass
                ? "!bg-emerald-500/90"
                : item.result === InspectionItemResult.fail
                  ? "!bg-red-500/90"
                  : item.result === InspectionItemResult.na
                    ? "!bg-slate-500"
                    : ""
            }`}
            aria-hidden
          />
        ))}
      </div>
      <p className="px-4 text-center text-xs text-slate-500">
        {activeIndex === items.length - 1
          ? "All items done? Sign and tap Done below."
          : "Swipe for next item →"}
      </p>
    </section>
  );
}
