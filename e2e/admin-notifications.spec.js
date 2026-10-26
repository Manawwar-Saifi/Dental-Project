import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Notifications Page", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("should navigate to notifications page and display heading", async ({
    page,
  }) => {
    await page.goto("/admin/notifications");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /notification/i });
    await expect(heading).toBeVisible();
  });

  test("should display stats cards or notification list", async ({ page }) => {
    await page.goto("/admin/notifications");
    await page.waitForLoadState("networkidle");

    const statsOrList = page.locator(
      "[class*='card'], [class*='stat'], [class*='notification'], table, [role='list'], ul"
    );
    await expect(statsOrList.first()).toBeVisible();
  });
});
