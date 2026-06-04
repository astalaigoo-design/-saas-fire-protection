"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BarcodeScannerSheetProps = {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  title?: string;
};

export function BarcodeScannerSheet({
  open,
  onClose,
  onScan,
  title = "Scan QR or barcode",
}: BarcodeScannerSheetProps) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null,
  );
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* camera may already be stopped */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      setManual("");
      setError(null);
      return;
    }

    let cancelled = false;
    setStarting(true);
    setError(null);

    void (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, false);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(280, Math.floor(viewfinderWidth * 0.85));
              const height = Math.min(180, Math.floor(viewfinderHeight * 0.45));
              return { width, height };
            },
          },
          (decoded) => {
            const text = decoded.trim();
            if (!text) return;
            void stopScanner();
            onScan(text);
            onClose();
          },
          () => {},
        );

        if (!cancelled) setStarting(false);
      } catch (err) {
        if (!cancelled) {
          setStarting(false);
          setError(
            err instanceof Error
              ? err.message
              : "Could not open the camera. Enter the code manually below.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, regionId, onClose, onScan, stopScanner]);

  const submitManual = () => {
    const text = manual.trim();
    if (!text) return;
    void stopScanner();
    onScan(text);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-sheet-title"
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h2 id="scan-sheet-title" className="text-lg font-semibold">
          {title}
        </h2>
        <Button type="button" variant="ghost" size="sm" className="min-h-10" onClick={onClose}>
          Close
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div
          id={regionId}
          className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-black min-h-[240px]"
        />
        {starting ? (
          <p className="text-center text-sm text-slate-400" role="status">
            Starting camera…
          </p>
        ) : null}
        {error ? (
          <p className="text-center text-sm text-amber-200" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Or type code
          </p>
          <div className="flex gap-2">
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Tag or barcode value"
              className="min-h-11 flex-1 border-slate-700 bg-slate-900 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitManual();
              }}
            />
            <Button type="button" className="min-h-11 shrink-0" onClick={submitManual}>
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
