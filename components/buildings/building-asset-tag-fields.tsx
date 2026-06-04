"use client";

import { useState } from "react";
import { BarcodeScannerSheet } from "@/components/scan/barcode-scanner-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BuildingAssetTagFieldsProps = {
  idPrefix: string;
  defaultTagNumber?: string;
  defaultBarcodeValue?: string;
};

export function BuildingAssetTagFields({
  idPrefix,
  defaultTagNumber = "",
  defaultBarcodeValue = "",
}: BuildingAssetTagFieldsProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<"tag" | "barcode">("tag");
  const [tagNumber, setTagNumber] = useState(defaultTagNumber);
  const [barcodeValue, setBarcodeValue] = useState(defaultBarcodeValue);

  const openScan = (target: "tag" | "barcode") => {
    setScanTarget(target);
    setScanOpen(true);
  };

  const handleScan = (value: string) => {
    if (scanTarget === "tag") {
      setTagNumber(value);
      if (!barcodeValue.trim()) setBarcodeValue(value);
    } else {
      setBarcodeValue(value);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tagNumber`}>Tag / asset ID</Label>
          <div className="flex gap-2">
            <Input
              id={`${idPrefix}-tagNumber`}
              name="tagNumber"
              value={tagNumber}
              onChange={(e) => setTagNumber(e.target.value)}
              placeholder="e.g. FE-1042"
              className="min-h-11 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 px-3"
              onClick={() => openScan("tag")}
            >
              Scan
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-barcodeValue`}>QR / barcode value</Label>
          <div className="flex gap-2">
            <Input
              id={`${idPrefix}-barcodeValue`}
              name="barcodeValue"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="Same as tag or UPC payload"
              className="min-h-11 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 px-3"
              onClick={() => openScan("barcode")}
            >
              Scan
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Encoded on printed labels; field app matches tag or this value.
          </p>
        </div>
      </div>

      <BarcodeScannerSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={handleScan}
        title={scanTarget === "tag" ? "Scan tag" : "Scan barcode"}
      />
    </>
  );
}
