import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductScreenshotProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function ProductScreenshot({
  src,
  alt,
  width,
  height,
  className,
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px",
  priority = false,
}: ProductScreenshotProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border/80 bg-background shadow-lg ring-1 ring-border/40",
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain object-top"
      />
    </div>
  );
}
