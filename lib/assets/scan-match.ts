/** Normalize scanned or typed tag/barcode for lookup. */
export function normalizeScanValue(value: string): string {
  return value.trim().toLowerCase();
}

export type BuildingAssetScanRow = {
  id: string;
  tagNumber: string | null;
  barcodeValue: string | null;
};

/** Map normalized scan payload → building asset id (tag and barcode fields). */
export function buildAssetScanIndex(assets: BuildingAssetScanRow[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const asset of assets) {
    for (const raw of [asset.barcodeValue, asset.tagNumber]) {
      const trimmed = raw?.trim();
      if (!trimmed) continue;
      const key = normalizeScanValue(trimmed);
      if (!index.has(key)) index.set(key, asset.id);
    }
  }

  return index;
}

export function findAssetIdByScanValue(
  scanValue: string,
  index: Map<string, string>,
): string | null {
  const key = normalizeScanValue(scanValue);
  if (!key) return null;
  return index.get(key) ?? null;
}

/** Default barcode payload when generating labels (explicit barcode or tag). */
export function assetLabelScanPayload(asset: {
  tagNumber: string | null;
  barcodeValue: string | null;
}): string | null {
  const barcode = asset.barcodeValue?.trim();
  if (barcode) return barcode;
  const tag = asset.tagNumber?.trim();
  return tag || null;
}
