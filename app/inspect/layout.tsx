import type { Metadata } from "next";
import { InspectFieldHeader } from "@/components/inspect/inspect-field-header";
import { DASHBOARD_ROBOTS_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = DASHBOARD_ROBOTS_METADATA;

export default function InspectLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InspectFieldHeader />
      {children}
    </>
  );
}
