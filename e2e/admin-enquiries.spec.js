import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Enquiries Page", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("should navigate to enquiries page and display heading", async ({
    page,
  }) => {
    await page.goto("/admin/enquiries");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /enquir/i });
    await expect(heading).toBeVisible();
  });

  test("should display a table or list of enquiries", async ({ page }) => {
    await page.goto("/admin/enquiries");
    await page.waitForLoadState("networkidle");

    const tableOrList = page.locator("table, [role='list'], ul, ol, .list");
    await expect(tableOrList.first()).toBeVisible();
  });
});
