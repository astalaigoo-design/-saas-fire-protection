import type { Metadata } from "next";
import { CommandCenterView } from "@/components/operations/command-center-view";
import {
  marketingAutomationPreview,
  marketingCommandCenterPreview,
  marketingQuotePipelineMetrics,
} from "@/lib/marketing/preview-data";
import { getOutboundChannelsStatus } from "@/lib/outbound/channels";

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
          assignableStaff={[
            { id: "user-tech", name: "Jordan Lee", role: "technician" },
            { id: "user-admin", name: "Alex Morgan", role: "admin" },
          ]}
          quotePipeline={marketingQuotePipelineMetrics}
          outboundChannels={getOutboundChannelsStatus()}
          defaultTab="quotes"
        />
      </div>
    </main>
  );
}
