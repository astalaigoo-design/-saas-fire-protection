import type { Metadata } from "next";
import { CommandCenterView } from "@/components/operations/command-center-view";
import { marketingCommandCenterPreview, marketingAutomationPreview } from "@/lib/marketing/preview-data";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Marketing preview — command center",
};

const emptyAuditLog = {
  events: [],
  nextCursor: null,
};

export default function MarketingCommandCenterPage() {
  return (
    <main className="min-h-[720px] bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <CommandCenterView
          snapshot={marketingCommandCenterPreview}
          auditLog={emptyAuditLog}
          auditFilters={{ action: "", entityType: "" }}
          automation={marketingAutomationPreview}
        />
      </div>
    </main>
  );
}
