import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import {
  getMarketingScreenshotAsset,
  marketingScreenshotAssets,
  marketingScreenshotPaths,
} from "@/lib/marketing/screenshot-assets";

export { marketingScreenshotPaths };

type ProductShowcaseItem = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
};

export const productShowcase: ProductShowcaseItem[] = [
  {
    title: "NFPA field inspection",
    description:
      "Technicians swipe through citation-backed checklist items on their phone. Big pass/fail controls, offline sync, and deficiency photos on failed items only.",
    ...pickShowcaseImage("field-inspection"),
    imageAlt:
      "GetFlareflow mobile inspection checklist with NFPA citation and pass or fail controls",
  },
  {
    title: "Client-ready compliance report",
    description:
      "Submit once — GetFlareflow generates a branded PDF with NFPA references, pass/fail summary, photos, and signature. Email it to the customer automatically.",
    ...pickShowcaseImage("compliance-report"),
    imageAlt: "Public compliance report page with PDF download for the building owner",
  },
  {
    title: "Command center for owners",
    description:
      "See overdue buildings, open deficiencies, draft repair quotes from failed items, and reports sent this month — without digging through spreadsheets.",
    ...pickShowcaseImage("command-center"),
    imageAlt:
      "GetFlareflow command center dashboard showing overdue inspections and quote workload",
  },
];

function pickShowcaseImage(id: (typeof marketingScreenshotAssets)[number]["id"]) {
  const asset = getMarketingScreenshotAsset(id);
  return {
    imageSrc: asset.imagePath,
    imageWidth: asset.imageWidth,
    imageHeight: asset.imageHeight,
  };
}

export function ProductShowcaseImage({
  item,
  priority = false,
}: {
  item: ProductShowcaseItem;
  priority?: boolean;
}) {
  const isTallMobile =
    item.imageHeight > item.imageWidth && item.imageHeight > 500;

  return (
    <ProductScreenshot
      src={item.imageSrc}
      alt={item.imageAlt}
      width={item.imageWidth}
      height={item.imageHeight}
      priority={priority}
      className={
        isTallMobile
          ? "mx-auto max-w-[220px]"
          : undefined
      }
      sizes={
        isTallMobile
          ? "(max-width: 640px) 220px, 220px"
          : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px"
      }
    />
  );
}
