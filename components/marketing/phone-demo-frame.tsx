import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PhoneDemoFrameProps = {
  children: ReactNode;
  badge?: string;
  className?: string;
};

/** Mobile phone chrome for marketing demos (video or interactive preview). */
export function PhoneDemoFrame({ children, badge, className }: PhoneDemoFrameProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[320px]", className)}>
      <div className="relative rounded-[2rem] border border-border/80 bg-slate-950 p-2 shadow-2xl shadow-primary/10 ring-1 ring-white/10">
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-800" aria-hidden />
        {badge ? (
          <p className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/30 bg-background px-3 py-1 text-[11px] font-medium text-primary shadow-sm">
            {badge}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-[1.5rem] bg-slate-950">{children}</div>
      </div>
    </div>
  );
}
