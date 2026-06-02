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

const OUT_DIR = path.join(process.cwd(), "public", "marketing");
const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const shots = [
  {
    path: "/marketing-screenshot/field-inspection",
    file: "field-inspection.png",
    viewport: { width: 390, height: 844 },
  },
  {
    path: "/marketing-screenshot/compliance-report",
    file: "compliance-report.png",
    viewport: { width: 420, height: 844 },
  },
  {
    path: "/marketing-screenshot/command-center",
    file: "command-center.png",
    viewport: { width: 1280, height: 900 },
  },
] as const;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(60_000);

  for (const shot of shots) {
    await page.setViewportSize(shot.viewport);
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, shot.file),
      fullPage: false,
    });
    console.log(`Wrote public/marketing/${shot.file}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
