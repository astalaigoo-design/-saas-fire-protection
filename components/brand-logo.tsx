import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function BrandLogo({
  className,
  logoClassName,
  textClassName,
  showText = true,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src="/brand-logo.png"
        alt=""
        className={cn("size-10 shrink-0 rounded-xl object-cover", logoClassName)}
        aria-hidden="true"
      />
      {showText ? (
        <span
          className={cn(
            "font-heading text-sm font-semibold tracking-tight text-foreground",
            textClassName,
          )}
        >
          {APP_NAME}
        </span>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </span>
  );
}
