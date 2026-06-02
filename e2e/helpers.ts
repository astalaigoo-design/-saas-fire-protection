import type { Page } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { QuoteStatus } from "@prisma/client";

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

export async function scrollChecklistToIndex(page: Page, index: number): Promise<void> {
  const scroll = page.getByLabel("Inspection checklist").locator("div.snap-x").first();
  await scroll.evaluate((element, targetIndex) => {
    const card = element.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = 12;
    element.scrollLeft = targetIndex * (card.offsetWidth + gap);
  }, index);
  await page.waitForTimeout(300);
}

export async function failFirstChecklistItemWithNote(page: Page, note: string): Promise<void> {
  await page.getByRole("button", { name: "Fail" }).first().click();
  const textarea = page.getByPlaceholder("Describe the deficiency…").first();
  await textarea.fill(note);
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/checklist") && resp.ok(),
      { timeout: 15_000 },
    ),
    textarea.blur(),
  ]).catch(async () => {
    await textarea.blur();
    await page.waitForTimeout(400);
  });
  await scrollChecklistToIndex(page, 1);
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

/** Marks a draft quote as sent when outbound email is not configured in the test env. */
export async function markDraftQuoteSentForE2e(
  quoteId: string,
  sentTo: string,
): Promise<string> {
  const { ensureQuoteShareToken } = await import("@/lib/quotes/share-token");
  const { prisma } = await import("@/lib/prisma");

  const shareToken = await ensureQuoteShareToken(quoteId);
  const now = new Date();
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: QuoteStatus.sent,
      sentTo,
      sentAt: now,
      statusChangedAt: now,
    },
  });
  return shareToken;
}

export function publicQuotePathFromToken(shareToken: string): string {
  return `/q/${shareToken}`;
}

export async function openScheduleFormForBuilding(
  page: Page,
  buildingId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.goto(`/dashboard/buildings/${buildingId}`);
    await page.getByRole("link", { name: "Schedule inspection" }).click();
    await page.waitForURL(/\/dashboard\/jobs\/new/);

    const typeSelect = page.locator("#inspection-type-id");
    if ((await typeSelect.count()) > 0) {
      await typeSelect.waitFor({ state: "visible", timeout: 15_000 });
      return;
    }

    await page.waitForTimeout(1500);
  }

  throw new Error("Schedule form did not load — no buildings or inspection types for this company.");
}

export async function scheduleInspectionFromForm(page: Page): Promise<void> {
  const typeSelect = page.locator("#inspection-type-id");
  const options = typeSelect.locator("option:not([disabled])");
  const optionCount = await options.count();
  if (optionCount === 0) {
    throw new Error("No inspection types available to schedule.");
  }
  await typeSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Schedule inspection" }).click();
  await page.waitForURL(/\/dashboard\/jobs\?.*scheduled=1/, { timeout: 60_000 });
}

export async function openFirstScheduledInspection(page: Page): Promise<void> {
  await page.goto("/dashboard/inspections");
  const inspectionLink = page.locator('a[data-testid^="inspection-link-"]').first();
  await inspectionLink.waitFor({ timeout: 60_000 });
  await inspectionLink.click();
  await page.waitForURL(/\/inspect\//);
}
