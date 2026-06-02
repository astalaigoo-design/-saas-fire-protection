/**
 * Marketing screenshots: capture from /marketing-screenshot/* → public/marketing/*.png
 * Regenerate: npm run marketing:screenshots (dev server required)
 */
export type MarketingScreenshotAsset = {
  id: string;
  /** Public preview route (real app components + demo data). */
  previewPath: `/marketing-screenshot/${string}`;
  /** Committed PNG served on the landing page. */
  imagePath: `/marketing/${string}.png`;
  captureViewport: { width: number; height: number };
  imageWidth: number;
  imageHeight: number;
};

export const marketingScreenshotAssets = [
  {
    id: "field-inspection",
    previewPath: "/marketing-screenshot/field-inspection",
    imagePath: "/marketing/field-inspection.png",
    captureViewport: { width: 390, height: 844 },
    imageWidth: 390,
    imageHeight: 844,
  },
  {
    id: "compliance-report",
    previewPath: "/marketing-screenshot/compliance-report",
    imagePath: "/marketing/compliance-report.png",
    captureViewport: { width: 420, height: 844 },
    imageWidth: 420,
    imageHeight: 844,
  },
  {
    id: "command-center",
    previewPath: "/marketing-screenshot/command-center",
    imagePath: "/marketing/command-center.png",
    captureViewport: { width: 1280, height: 900 },
    imageWidth: 1280,
    imageHeight: 900,
  },
] as const satisfies readonly MarketingScreenshotAsset[];

export type MarketingScreenshotId = (typeof marketingScreenshotAssets)[number]["id"];

const assetById = Object.fromEntries(
  marketingScreenshotAssets.map((asset) => [asset.id, asset]),
) as Record<MarketingScreenshotId, (typeof marketingScreenshotAssets)[number]>;

export function getMarketingScreenshotAsset(id: MarketingScreenshotId) {
  return assetById[id];
}

/** @deprecated Use marketingScreenshotAssets — kept for imports that expect path map. */
export const marketingScreenshotPaths = {
  fieldInspection: assetById["field-inspection"].imagePath,
  complianceReport: assetById["compliance-report"].imagePath,
  commandCenter: assetById["command-center"].imagePath,
} as const;
