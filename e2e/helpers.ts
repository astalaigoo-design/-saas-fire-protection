import type { Page } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

const E2E_PASSWORD = process.env.E2E_CLERK_PASSWORD ?? "E2eTestPassword!9";

function e2eBaseUrl(): string {
  return (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

function e2eUrl(path: string): string {
  return `${e2eBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function uniqueRunId(): string {
  return `${Date.now()}`;
}

export async function clerkSignUp(page: Page, email: string): Promise<void> {
  await setupClerkTestingToken({ page });
  await page.goto(e2eUrl("/sign-up"));
  await page.waitForSelector(".cl-signUp-root", { state: "attached" });

  const firstNameInput = page.locator('input[name=firstName]');
  if (await firstNameInput.isVisible()) {
    await firstNameInput.fill("E2E");
  }
  const lastNameInput = page.locator('input[name=lastName]');
  if (await lastNameInput.isVisible()) {
    await lastNameInput.fill("Tester");
  }

  await page.locator('input[name=emailAddress]').fill(email);
  await page.locator('input[name=password]').fill(E2E_PASSWORD);

  const legalCheckbox = page.locator('input[name=legalAccepted]');
  if (await legalCheckbox.isVisible()) {
    await legalCheckbox.check();
  }

  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const verificationCode = page.getByRole("textbox", { name: "Enter verification code" });
  await verificationCode.waitFor({ timeout: 60_000 });
  await verificationCode.pressSequentially("424242");
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
}

export async function passAllChecklistItems(page: Page): Promise<void> {
  const progress = page.getByLabel("Inspection checklist").getByText(/\d+\/\d+ done/);
  await progress.waitFor();

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const text = (await progress.textContent()) ?? "";
    const match = text.match(/(\d+)\/(\d+) done/);
    if (match && match[1] === match[2]) return;

    const passButton = page.getByRole("button", { name: "Pass" }).first();
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/inspect/") && resp.url().includes("/checklist"),
        { timeout: 15_000 },
      ),
      passButton.click(),
    ]).catch(() => passButton.click());
    await page.waitForTimeout(200);
  }

  throw new Error("Could not complete all checklist items within the retry limit.");
}

export async function drawSignature(page: Page): Promise<void> {
  const canvas = page.locator("canvas").first();
  await canvas.waitFor();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas not found.");

  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.5;
  const endX = box.x + box.width * 0.8;
  const endY = box.y + box.height * 0.45;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.mouse.up();
}
