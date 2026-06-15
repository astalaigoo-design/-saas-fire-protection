import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { DESIGN_PARTNER_APPLY_PATH } from "@/lib/branding";
import {
  marketingHeaderCtaClass,
  marketingHeaderLinkClass,
} from "@/lib/marketing/cta-classes";
import { cn } from "@/lib/utils";

const primaryNavLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

const homePrimaryLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: DESIGN_PARTNER_APPLY_PATH, label: "Design partner" },
  { href: "#compare", label: "Compare" },
  { href: "#solutions", label: "Solutions" },
  { href: "#contact", label: "Contact" },
] as const;

export type MarketingHeaderProps = {
  variant?: "home" | "compact";
  maxWidth?: "3xl" | "4xl" | "6xl";
  priorityLogo?: boolean;
  hideDesignPartner?: boolean;
  showPricing?: boolean | "sm";
  showSignIn?: boolean;
  startFreeHref?: string;
  startFreeLabel?: string;
};

export function MarketingHeader({
  variant = "compact",
  maxWidth = "6xl",
  priorityLogo = false,
  hideDesignPartner = false,
  showPricing = true,
  showSignIn = true,
  startFreeHref = "/sign-up",
  startFreeLabel = "Start free",
}: MarketingHeaderProps) {
  const maxWidthClass =
    maxWidth === "3xl" ? "max-w-3xl" : maxWidth === "4xl" ? "max-w-4xl" : "max-w-6xl";

  const pricingLinkClass = cn(
    marketingHeaderLinkClass,
    showPricing === "sm" && "hidden sm:inline-flex",
  );

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6",
          maxWidthClass,
        )}
      >
        <BrandLogo logoClassName="size-9" textClassName="text-lg" priority={priorityLogo} />

        {variant === "home" ? (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {homePrimaryLinks.map((item) => (
              <Link key={item.href} href={item.href} className={primaryNavLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label={variant === "home" ? "Account" : "Site"}
        >
          {variant === "compact" && showPricing ? (
            <Link href="/pricing" className={pricingLinkClass}>
              Pricing
            </Link>
          ) : null}

          {!hideDesignPartner ? (
            <Link
              href={DESIGN_PARTNER_APPLY_PATH}
              className={cn(marketingHeaderLinkClass, variant === "home" && "md:hidden")}
            >
              Design partner
            </Link>
          ) : null}

          {showSignIn ? (
            <Link href="/sign-in" className={marketingHeaderLinkClass}>
              Sign in
            </Link>
          ) : null}

          <Link href={startFreeHref} className={marketingHeaderCtaClass}>
            {startFreeLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
