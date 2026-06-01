import { expect, test } from "@playwright/test";
import { clerkSignUp, drawSignature, passAllChecklistItems, uniqueRunId } from "./helpers";

test.describe("Inspection pilot flow", () => {
  test("sign-up → customer → building → job → inspect → submit → public report 200", async ({
    page,
    request,
  }) => {
    test.setTimeout(360_000);
    const runId = uniqueRunId();
    const customerName = `E2E Customer ${runId}`;
    const buildingName = `E2E Building ${runId}`;
    const email = `e2e+clerk_test_${runId}@example.com`;

    await clerkSignUp(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/customers/new");
    await page.locator("#customer-name").fill(customerName);
    await page.locator("#customer-email").fill(`customer-${runId}@example.com`);
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

    await page.goto(`/dashboard/jobs/new?buildingId=${buildingId}`);
    await page.waitForURL(/\/dashboard\/jobs\/new/);
    await page.locator("#inspection-type-id").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Schedule inspection" }).click();
    await page.waitForURL(/\/dashboard\/jobs/);

    await page.goto("/dashboard/inspections");
    await page.locator('a[data-testid^="inspection-link-"]').first().click();
    await page.waitForURL(/\/inspect\//);

    await passAllChecklistItems(page);
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

    const apiPath = reportHref!.replace(/^\/r\//, "/api/public/reports/");
    const pdfResponse = await request.get(apiPath);
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
  });
});
