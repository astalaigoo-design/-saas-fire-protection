import { cn } from "@/lib/utils";

/** Shared styles for native `<select>` elements in server-rendered forms. */
export const nativeSelectClassName = cn(
  "min-h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  "dark:bg-input/30",
);
