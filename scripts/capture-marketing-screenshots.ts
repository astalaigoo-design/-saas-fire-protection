/**
 * Captures product UI screenshots for the marketing landing page.
 * Uses public /marketing-screenshot/* routes (real components, demo data).
 *
 * Usage: npm run marketing:screenshots
 * Requires dev server on PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { marketingScreenshotAssets } from "../lib/marketing/screenshot-assets";

const OUT_DIR = path.join(process.cwd(), "public", "marketing");
const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(60_000);

  for (const asset of marketingScreenshotAssets) {
    const file = path.basename(asset.imagePath);
    await page.setViewportSize(asset.captureViewport);
    await page.goto(`${BASE_URL}${asset.previewPath}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, file),
      fullPage: false,
    });
    console.log(`Captured ${asset.previewPath} → public/marketing/${file}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
