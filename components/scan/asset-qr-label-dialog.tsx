"use client";

import { QRCode } from "react-qr-code";
import { assetLabelScanPayload } from "@/lib/assets/scan-match";
import { buildingAssetLabel } from "@/lib/assets/format";
import type { AssetType } from "@prisma/client";
import { Button } from "@/components/ui/button";

type AssetQrLabelDialogProps = {
  open: boolean;
  onClose: () => void;
  asset: {
    assetType: AssetType;
    tagNumber: string | null;
    barcodeValue: string | null;
    location: string;
  };
};

export function AssetQrLabelDialog({ open, onClose, asset }: AssetQrLabelDialogProps) {
  if (!open) return null;

  const payload = assetLabelScanPayload(asset);
  const label = buildingAssetLabel(asset);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-label-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="qr-label-title" className="font-heading text-lg font-semibold text-foreground">
          Scan label
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {payload ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4">
            <QRCode value={payload} size={180} level="M" />
            <p className="break-all text-center font-mono text-sm text-foreground">{payload}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Add a tag or barcode value on this item to generate a label.
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Print or screenshot for field crews. Scans match tag or barcode on this register item.
        </p>
        <Button type="button" className="mt-6 min-h-11 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
