"use client";

import { useState } from "react";
import { BarcodeScannerSheet } from "@/components/scan/barcode-scanner-sheet";
import { Button } from "@/components/ui/button";

type InspectionTagScanBarProps = {
  disabled?: boolean;
  offlineMode?: boolean;
  message?: string | null;
  onScan: (value: string) => void;
};

export function InspectionTagScanBar({
  disabled = false,
  offlineMode = false,
  message = null,
  onScan,
}: InspectionTagScanBarProps) {
  const [scanOpen, setScanOpen] = useState(false);

  if (disabled) return null;

  return (
    <section className="space-y-2 px-4" aria-label="Scan equipment tag">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Scan tag</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Scan QR or barcode on the label to jump to the matching checklist item.
          </p>
        </div>
        {!offlineMode ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-amber-500/40 bg-amber-500/10 text-white hover:bg-amber-500/20 sm:w-auto"
            onClick={() => setScanOpen(true)}
          >
            Scan QR / barcode
          </Button>
        ) : null}
      </div>

      {offlineMode ? (
        <p className="text-xs text-slate-500">
          Camera scan needs a connection. Scroll the checklist or register to find the item.
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-amber-200" role="status">
          {message}
        </p>
      ) : null}

      <BarcodeScannerSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={onScan}
        title="Scan equipment tag"
      />
    </section>
  );
}
