import { ProductScreenshot } from "@/components/marketing/product-screenshot";

export const marketingScreenshotPaths = {
  fieldInspection: "/marketing/field-inspection.png",
  complianceReport: "/marketing/compliance-report.png",
  commandCenter: "/marketing/command-center.png",
} as const;

type ProductShowcaseItem = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export const productShowcase: ProductShowcaseItem[] = [
  {
    title: "NFPA field inspection",
    description:
      "Technicians swipe through citation-backed checklist items on their phone. Big pass/fail controls, offline sync, and deficiency photos on failed items only.",
    imageSrc: marketingScreenshotPaths.fieldInspection,
    imageAlt: "GetFlareflow mobile inspection checklist with NFPA citation and pass or fail controls",
  },
  {
    title: "Client-ready compliance report",
    description:
      "Submit once — GetFlareflow generates a branded PDF with NFPA references, pass/fail summary, photos, and signature. Email it to the customer automatically.",
    imageSrc: marketingScreenshotPaths.complianceReport,
    imageAlt: "Public compliance report page with PDF download for the building owner",
  },
  {
    title: "Command center for owners",
    description:
      "See overdue buildings, open deficiencies, draft repair quotes from failed items, and reports sent this month — without digging through spreadsheets.",
    imageSrc: marketingScreenshotPaths.commandCenter,
    imageAlt: "GetFlareflow command center dashboard showing overdue inspections and quote workload",
  },
];

export function ProductShowcaseImage({
  item,
  priority = false,
}: {
  item: ProductShowcaseItem;
  priority?: boolean;
}) {
  return (
    <ProductScreenshot
      src={item.imageSrc}
      alt={item.imageAlt}
      priority={priority}
      className="max-h-[340px] object-cover object-top"
    />
  );
}
