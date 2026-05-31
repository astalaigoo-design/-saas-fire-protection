"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyReportLinkButtonProps = {
  url: string;
};

export function CopyReportLinkButton({ url }: CopyReportLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => setCopied(true));
      }}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
    >
      {copied ? "Link copied" : "Copy customer link"}
    </button>
  );
}
