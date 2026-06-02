import { expect, test } from "@playwright/test";
import {
  clerkSignUp,
  drawSignature,
  failFirstChecklistItemWithNote,
  markDraftQuoteSentForE2e,
  openFirstScheduledInspection,
  openScheduleFormForBuilding,
  passAllChecklistItems,
  publicQuotePathFromToken,
  scheduleInspectionFromForm,
  uniqueRunId,
} from "./helpers";

test.describe("Inspection pilot flow", () => {
  test("sign-up → customer → building → job → inspect → submit → report + quote + billing smoke", async ({
    page,
    request,
  }) => {
    test.setTimeout(480_000);
    const runId = uniqueRunId();
    const customerName = `E2E Customer ${runId}`;
    const buildingName = `E2E Building ${runId}`;
    const customerEmail = `customer-${runId}@example.com`;
    const email = `e2e+clerk_test_${runId}@example.com`;

    await clerkSignUp(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/customers/new");
    await page.locator("#customer-name").fill(customerName);
    await page.locator("#customer-email").fill(customerEmail);
    await page.getByRole("button", { name: "Create customer" }).click();
    await page.waitForURL(/\/dashboard\/customers\//);

    await page.getByRole("link", { name: "Add building" }).click();
    await page.waitForURL(/\/dashboard\/buildings\/new/);
    await page.locator("#name").fill(buildingName);
    await page.locator("#addressLine1").fill("100 E2E Test Street");
    await page.locator("#city").fill("Boston");
    await page.locator("#region").fill("MA");
    await page.locator("#postalCode").fill("02108");
    await page.getByRole("button", { name: "Create building" }).click();
    await page.waitForURL(
      (url) => /^\/dashboard\/buildings\/[^/]+$/.test(url.pathname),
      { timeout: 60_000 },
    );
    const buildingId = new URL(page.url()).pathname.split("/").pop();
    if (!buildingId) throw new Error("Could not read building id after create.");

    await openScheduleFormForBuilding(page, buildingId);
    await scheduleInspectionFromForm(page);
    await openFirstScheduledInspection(page);

    await failFirstChecklistItemWithNote(page, "E2E deficiency — obstructed sprinkler head.");    await passAllChecklistItems(page);
    await drawSignature(page);
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByText("Inspection submitted and locked.").waitFor({ timeout: 90_000 });

    await page.goto("/dashboard/reports");
    const publicReportLink = page.getByTestId("public-report-link").first();
    await publicReportLink.waitFor({ timeout: 60_000 });
    const reportHref = await publicReportLink.getAttribute("href");
    expect(reportHref).toMatch(/\/r\//);

    const reportPageResponse = await page.goto(reportHref!);
    expect(reportPageResponse?.status()).toBe(200);
    await expect(page.getByRole("link", { name: "View compliance PDF" })).toBeVisible();

    const reportApiPath = reportHref!.replace(/^\/r\//, "/api/public/reports/");
    const pdfResponse = await request.get(reportApiPath);
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");

    await page.goto("/dashboard/reports");
    await expect(page.getByRole("heading", { name: "Draft repair quotes" })).toBeVisible();
    await expect(page.getByText("No draft quotes yet")).toHaveCount(0);

    const quoteId = await page.locator('input[name="quoteId"]').first().inputValue();
    expect(quoteId.length).toBeGreaterThan(0);

    await page.locator('input[id$="-unit-price"]').first().fill("150");
    await page.getByRole("button", { name: "Save pricing" }).click();
    await page.getByText("Quote pricing saved.").waitFor({ timeout: 60_000 });

    let quotePublicPath: string | null = null;

    await page.getByRole("button", { name: "Email report & quote" }).click();

    const sendLink = page.getByTestId("public-quote-link");
    const sendError = page.getByRole("alert").filter({
      hasText: /not configured|RESEND|REPORT_EMAIL|unit price|customer email/i,
    });

    const sendOutcome = await Promise.race([
      sendLink.waitFor({ timeout: 60_000 }).then(() => "sent" as const),
      sendError.waitFor({ timeout: 60_000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    if (sendOutcome === "sent") {
      const quoteHref = await sendLink.getAttribute("href");
      expect(quoteHref).toMatch(/\/q\//);
      quotePublicPath = new URL(quoteHref!, page.url()).pathname;
    } else {
      const shareToken = await markDraftQuoteSentForE2e(quoteId, customerEmail);
      quotePublicPath = publicQuotePathFromToken(shareToken);
      await page.reload();
      await page.getByTestId("public-quote-link").first().waitFor({ timeout: 60_000 });
    }

    expect(quotePublicPath).toMatch(/\/q\//);
    const quoteToken = quotePublicPath!.replace(/^\/q\//, "");

    const quotePageResponse = await page.goto(quotePublicPath!);
    expect(quotePageResponse?.status()).toBe(200);
    await expect(page.getByRole("button", { name: "Accept quote" })).toBeVisible();

    const quotePdfResponse = await request.get(`/api/public/quotes/${quoteToken}`);
    expect(quotePdfResponse.status()).toBe(200);
    expect(quotePdfResponse.headers()["content-type"]).toContain("application/pdf");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Accept quote" }).click();
    await page
      .getByText(/acceptance has been recorded|You accepted this quote/i)
      .waitFor({ timeout: 30_000 });

    const acceptApiResponse = await request.post(`/api/public/quotes/${quoteToken}/respond`, {
      data: { action: "accept" },
      headers: { "Content-Type": "application/json" },
    });
    expect(acceptApiResponse.status()).toBe(400);

    await page.goto("/dashboard/reports");
    await expect(page.getByRole("heading", { name: "Accepted quotes" })).toBeVisible();
    await expect(page.getByText(customerName)).toBeVisible();

    await page.goto("/dashboard/billing");
    await expect(page).toHaveURL(/\/dashboard\/billing/);
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(page.getByText(/Free trial|trial/i).first()).toBeVisible();
  });
});
