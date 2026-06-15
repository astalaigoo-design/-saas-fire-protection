import { expect, test } from "@playwright/test";
import { clerkSignUp, uniqueRunId } from "./helpers";

test.describe("Parts catalog", () => {
  test("owner can open parts inventory page", async ({ page }) => {
    const email = `e2e+parts_${uniqueRunId()}@example.com`;
    await clerkSignUp(page, email);

    const response = await page.goto("/dashboard/parts");
    expect(response?.status()).toBeLessThan(500);

    const errorTitle = page.getByRole("heading", { name: "Could not load parts catalog" });
    await expect(errorTitle).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "Parts inventory" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: "Add part" })).toBeVisible();
  });
});
