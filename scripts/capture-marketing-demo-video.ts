/**
 * Records a short field-inspection demo video for the marketing homepage.
 * Simulates a technician tapping Pass/Fail through the live preview route.
 *
 * Usage: npm run marketing:demo-video
 * Requires dev server on PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000).
 *
 * Output: public/marketing/demo/hero-field-inspection.webm
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const OUT_DIR = path.join(process.cwd(), "public", "marketing", "demo");
const OUT_FILE = path.join(OUT_DIR, "hero-field-inspection.webm");
const VIEWPORT = { width: 390, height: 844 };

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: OUT_DIR,
      size: VIEWPORT,
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${BASE_URL}/marketing-screenshot/field-inspection`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('button:has-text("Pass")', { timeout: 60_000 });

  const passButtons = page.getByRole("button", { name: "Pass" });
  const failButtons = page.getByRole("button", { name: "Fail" });

  await passButtons.first().click();
  await page.waitForTimeout(600);

  for (let i = 0; i < 3; i += 1) {
    await page.mouse.wheel(120, 0);
    await page.waitForTimeout(500);
    const pass = passButtons.nth(Math.min(i + 1, 2));
    if (await pass.isVisible()) {
      await pass.click();
      await page.waitForTimeout(600);
    }
  }

  await page.mouse.wheel(120, 0);
  await page.waitForTimeout(400);
  if (await failButtons.first().isVisible()) {
    await failButtons.first().click();
    await page.waitForTimeout(900);
  }

  await page.waitForTimeout(1200);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    throw new Error("Playwright did not produce a video recording.");
  }

  const tempPath = await video.path();
  fs.renameSync(tempPath, OUT_FILE);
  console.log(`Recorded demo → public/marketing/demo/hero-field-inspection.webm`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
