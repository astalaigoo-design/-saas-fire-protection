"use client";

import { useState } from "react";
import { BuildingHeader } from "@/components/inspect/building-header";
import { ChecklistCarousel } from "@/components/inspect/checklist-carousel";
import type { ChecklistItemState } from "@/components/inspect/checklist-item-card";
import { marketingInspectionPreview } from "@/lib/marketing/preview-data";

export function MarketingFieldInspectionPreview() {
  const inspection = marketingInspectionPreview;
  const [items, setItems] = useState<ChecklistItemState[]>(() =>
    inspection.items.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      linkedTagNumber: null,
      result: item.result,
      notes: item.notes,
    })),
  );

  return (
    <div className="min-h-[720px] bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-3 py-4">
        <div className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2">
          <span className="size-2 rounded-full bg-amber-400" aria-hidden />
          <span className="text-[11px] font-medium text-amber-100">Saved locally — will sync</span>
        </div>
        <BuildingHeader inspection={inspection} locked={false} />
        <ChecklistCarousel
          inspectionId={inspection.id}
          items={items}
          photos={[]}
          locked={false}
          onItemsChange={setItems}
          onPhotoAdded={() => {}}
        />
      </div>
    </div>
  );
}
