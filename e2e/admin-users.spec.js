import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers/admin-auth.js";

test.describe("Admin Users Page", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("should navigate to users page and display heading", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /staff|user/i });
    await expect(heading).toBeVisible();
  });

  test("should display a table with staff list", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    await expect(table.first()).toBeVisible();
  });
});
