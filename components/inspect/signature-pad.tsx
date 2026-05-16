"use client";

import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  disabled?: boolean;
  initialDataUrl?: string | null;
  onChange: (dataUrl: string | null) => void;
};

function getPoint(
  canvas: HTMLCanvasElement,
  event: React.TouchEvent | React.MouseEvent,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();

  if ("touches" in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function SignaturePad({
  disabled = false,
  initialDataUrl,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(Boolean(initialDataUrl));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#f8fafc";

    if (initialDataUrl) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  const emitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const startDraw = (event: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = canvas ? getPoint(canvas, event) : null;
    if (!ctx || !point) return;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event: React.TouchEvent | React.MouseEvent) => {
    if (disabled || !drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = canvas ? getPoint(canvas, event) : null;
    if (!ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  };

  const endDraw = (event: React.TouchEvent | React.MouseEvent) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawingRef.current = false;
    if (hasStroke) emitSignature();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-300">Signature</span>
        {!disabled ? (
          <button
            type="button"
            onClick={clear}
            className="min-h-10 rounded-lg px-3 text-sm text-amber-400 hover:bg-slate-800"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none"
          aria-label="Sign with your finger"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="text-xs text-slate-500">Sign above to certify this inspection.</p>
    </div>
  );
}
