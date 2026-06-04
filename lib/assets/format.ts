import type { AssetType } from "@prisma/client";
import { assetTypeLabel } from "@/lib/assets/constants";

type AssetLabelFields = {
  assetType: AssetType;
  tagNumber: string | null;
  location: string;
};

export function buildingAssetLabel(asset: AssetLabelFields): string {
  const type = assetTypeLabel(asset.assetType);
  if (asset.tagNumber?.trim()) {
    return `${type} · Tag ${asset.tagNumber.trim()}`;
  }
  return `${type} · ${asset.location.trim()}`;
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
