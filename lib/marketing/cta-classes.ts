import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 44px+ touch targets for marketing CTAs (WCAG / mobile field use). */
export const marketingPrimaryCtaClass = cn(
  buttonVariants({ size: "lg" }),
  "min-h-12 w-full justify-center px-6 text-base sm:w-auto sm:min-w-[11rem]",
);

export const marketingSecondaryCtaClass = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "min-h-12 w-full justify-center px-6 text-base sm:w-auto sm:min-w-[11rem]",
);

export const marketingHeaderLinkClass = cn(
  buttonVariants({ variant: "ghost", size: "sm" }),
  "min-h-11 min-w-11 px-4",
);

export const marketingHeaderCtaClass = cn(
  buttonVariants({ size: "sm" }),
  "min-h-11 min-w-11 px-4",
);
