import type { Metadata } from "next";
import { MarketingFieldInspectionPreview } from "@/components/marketing/marketing-field-inspection-preview";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Marketing preview — field inspection",
};

export default function MarketingFieldInspectionPage() {
  return <MarketingFieldInspectionPreview />;
}
