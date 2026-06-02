import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductScreenshotProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function ProductScreenshot({
  src,
  alt,
  className,
  priority = false,
}: ProductScreenshotProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={640}
      height={400}
      priority={priority}
      className={cn(
        "h-auto w-full rounded-xl border border-border/80 bg-background shadow-lg ring-1 ring-border/40",
        className,
      )}
      sizes="(max-width: 1024px) 100vw, 320px"
    />
  );
}
